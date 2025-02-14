// server.js

// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const admin = require('firebase-admin');
// const path = require('path');

// // Initialize Firebase Admin with your service account
// const serviceAccount = require(path.join(__dirname, 'serviceAccount.json'));

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://fire-escape1-default-rtdb.firebaseio.com" // <-- Replace with your DB URL
// });

// const db = admin.database();

// // Set up Express
// const app = express();
// const PORT = process.env.PORT || 3000;
// const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Replace with your secure secret

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

// Parse the service account JSON from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL, // Loaded from .env
});

const db = admin.database();

// Set up Express
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Configure CORS to allow only your production domain and localhost
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());

//Enable for specified origin:
const corsOptions = {
  origin: 'http://127.0.0.1:5500' // Replace with your frontend's origin
};
app.use(cors(corsOptions));

/* ---------------------------
   Helper Middleware: JWT Authentication
--------------------------- */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ error: 'Authorization header missing' });
  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ error: 'Invalid token' });
    req.user = user; // contains { uid, email }
    next();
  });
}

/* ---------------------------
   Endpoint: User Registration
   URL: POST /api/register
   Payload: { name, email, password, referralCode }
--------------------------- */
app.post('/api/register', async (req, res) => {
  // Destructure the provided referral code as "providedReferralCode"
  const { name, email, password, referralCode: providedReferralCode } = req.body;
  if (!(name && email && password)) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (snapshot.exists()) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    // Generate a unique referral code for the new user
    const newReferralCode = await generateUniqueReferralCode(db);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user node
    const newUserRef = usersRef.push();
    const uid = newUserRef.key;
    const today = new Date().toISOString().slice(0, 10);

    // Look up the referrer using the referral code provided by the client
    let referrerUid = null;
    if (providedReferralCode) {
      try {
        const snap = await usersRef.orderByChild('referralCode').equalTo(providedReferralCode).once('value');
        if (snap.exists()) {
          const userData = snap.val();
          // Get the first matching UID from the result.
          referrerUid = Object.keys(userData)[0];
        }
      } catch (error) {
        console.error('Failed to find referral code', error);
      }
    }

    // Save the new user record with their own unique referral code.
    await newUserRef.set({
      name,
      email,
      password: hashedPassword,
      referralCode: newReferralCode,  // New user's own unique referral code
      freeSpins: 2,
      adSpins: 0,
      lastSpinDate: today,
      dailyStreak: 0,
      earnings: 500,
      withdrawalRequests: {},
      referrer: referrerUid || null   // UID of the referrer if found
    });

    // Award referral bonus if a valid referral was found
    if (referrerUid) {
      await awardReferralBonus(db, referrerUid, uid);
      await awardSpinsForReferralTask(db, referrerUid);
    }

    res.json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   Endpoint: User Login
   URL: POST /api/login
   Payload: { email, password }
--------------------------- */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!(email && password)) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find user by email.
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const userData = snapshot.val();
    const userId = Object.keys(userData)[0];
    const user = userData[userId];

    // Check if the provided password is correct.
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate a JWT for the user.
    const token = jwt.sign({ uid: userId, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   Endpoint: Get User Profile
   URL: GET /api/profile
   Headers: Authorization: Bearer <token>
--------------------------- */
app.get('/api/profile', authenticateToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const snapshot = await db.ref(`users/${uid}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = snapshot.val();
    // Remove the password hash from the response.
    const { password, ...profile } = user;
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   Endpoint: Claim Daily Streak Reward
   URL: POST /api/streak/claim
   Headers: Authorization: Bearer <token>
--------------------------- */
app.post('/api/streak/claim', authenticateToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const userRef = db.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = snapshot.val();
    const lastLoginDate = user.lastLoginDate;
    const currentDate = new Date();
    const currentDateFormat = currentDate.toISOString().slice(0, 10);
    const today = new Date(currentDateFormat);

    // Determine if it's a new day since the last login.
    let isNewDay = false;
    if (lastLoginDate) {
      const lastLoginDateFormat = lastLoginDate.slice(0, 10);
      const lastLogin = new Date(lastLoginDateFormat);
      const timeDifference = today.getTime() - lastLogin.getTime();
      const dayDifference = timeDifference / (1000 * 3600 * 24);
      isNewDay = dayDifference >= 1;
    } else {
      isNewDay = true;
    }

    let newStreak = 0;
    if (isNewDay) {
      if (lastLoginDate) {
        const lastLoginDateFormat = lastLoginDate.slice(0, 10);
        const lastLogin = new Date(lastLoginDateFormat);
        const timeDifference = today.getTime() - lastLogin.getTime();
        const dayDifference = timeDifference / (1000 * 3600 * 24);
        newStreak = (dayDifference === 1) ? (user.dailyStreak || 0) + 1 : 1;
      } else {
        newStreak = 1;
      }
    } else {
      return res.status(400).json({ error: 'You have already claimed your reward today.' });
    }

    // Calculate reward amount.
    const rewardAmount = 10 + (newStreak - 1) * 0.5;

    // Update user data using a transaction.
    const transactionResult = await userRef.transaction((currentUser) => {
      if (currentUser === null) return currentUser;
      return {
        ...currentUser,
        dailyStreak: newStreak,
        totalStreakEarnings: (currentUser.totalStreakEarnings || 0) + rewardAmount,
        earnings: (currentUser.earnings || 0) + rewardAmount,
        lastLoginDate: new Date().toISOString()
      };
    });

    if (!transactionResult.committed) {
      return res.status(500).json({ error: 'Transaction failed. Please try again.' });
    }

    res.json({ message: 'Daily reward claimed!', rewardAmount, newStreak });

  } catch (error) {
    console.error("Streak claiming error:", error);
    res.status(500).json({ error: 'An error occurred while claiming the daily reward.' });
  }
});

/* ---------------------------
   Endpoint: Spin the Wheel
   URL: POST /api/spin
   Headers: Authorization: Bearer <token>
--------------------------- */
app.post('/api/spin', authenticateToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const userRef = db.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = snapshot.val();
    const today = new Date().toISOString().slice(0, 10);

    // Reset spins if a new day has started.
    let freeSpins = user.freeSpins;
    let adSpins = user.adSpins;
    let dailyStreak = user.dailyStreak;
    if (user.lastSpinDate !== today) {
      freeSpins = 2;
      adSpins = 0;
      dailyStreak = (user.dailyStreak || 0) + 1;
    }

    // Check if the user has any spins available.
    if (freeSpins <= 0 && adSpins <= 0) {
      return res.status(400).json({ error: 'No more spins available for today. Watch an ad to continue' });
    }

    // Use a free spin if available; otherwise, use an ad spin.
    if (freeSpins > 0) {
      freeSpins -= 1;
    } else {
      adSpins -= 1;
    }

    // Randomly generate a reward (multiples of ₦10 up to ₦500).
    const rewardOptions = Array.from({ length: 50 }, (_, i) => (i + 1) * 10);
    const randomIndex = Math.floor(Math.random() * rewardOptions.length);
    const reward = rewardOptions[randomIndex];

    const newEarnings = (user.earnings || 0) + reward;

    await userRef.update({
      freeSpins,
      adSpins,
      lastSpinDate: today,
      dailyStreak,
      earnings: newEarnings
    });

    res.json({ message: `Congratulations! You earned ₦${reward}`, reward, newEarnings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   Endpoint: Grant an Extra (Ad) Spin
   URL: POST /api/grantAdSpin
   Headers: Authorization: Bearer <token>
--------------------------- */
app.post('/api/grantAdSpin', authenticateToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const userRef = db.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = snapshot.val();
    const newAdSpins = (user.adSpins || 0) + 1;
    await userRef.update({ adSpins: newAdSpins });
    res.json({ message: 'Extra spin granted!', adSpins: newAdSpins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   Endpoint: Request a Withdrawal
   URL: POST /api/withdrawal
   Headers: Authorization: Bearer <token>
   Payload: { accountNumber, accountName, bankName, amount }
--------------------------- */
app.post('/api/withdrawal', authenticateToken, async (req, res) => {
  const uid = req.user.uid;
  const { accountNumber, accountName, bankName, amount } = req.body;

  if (!accountNumber || !accountName || !bankName || !amount) {
    return res.status(400).json({ error: 'Account number, name, bank name, and amount are required.' });
  }

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const userRef = db.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = snapshot.val();

    if (user.earnings < 20000) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₦20,000.' });
    }

    if (amountNum > user.earnings) {
      return res.status(400).json({ error: 'Insufficient earnings.' });
    }

    const withdrawalRef = db.ref(`users/${uid}/withdrawalRequests`).push();
    const withdrawalRequest = {
      accountNumber,
      accountName,
      bankName,
      amount: amountNum,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    // Use a transaction to deduct the withdrawal amount atomically.
    const transactionResult = await userRef.transaction((currentUser) => {
      if (currentUser === null) return currentUser;
      if (currentUser.earnings < amountNum) {
        return currentUser;
      }
      return {
        ...currentUser,
        earnings: currentUser.earnings - amountNum
      };
    });

    if (!transactionResult.committed) {
      return res.status(500).json({ error: 'Transaction failed. Please try again.' });
    }

    await withdrawalRef.set(withdrawalRequest);

    res.json({
      message: 'Withdrawal request submitted.',
      withdrawalRequest,
      newEarnings: transactionResult.snapshot.val().earnings
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ error: 'An error occurred while processing the withdrawal.' });
  }
});

/* ---------------------------
   Endpoint: Get Withdrawal History
   URL: GET /api/withdrawal/history
   Headers: Authorization: Bearer <token>
--------------------------- */
app.get('/api/withdrawal/history', authenticateToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const withdrawalRef = db.ref(`users/${uid}/withdrawalRequests`);
    const snapshot = await withdrawalRef.once('value');

    if (!snapshot.exists()) {
      return res.json([]);  // No withdrawal requests yet.
    }

    const withdrawals = [];
    snapshot.forEach(childSnapshot => {
      const withdrawal = childSnapshot.val();
      withdrawals.push(withdrawal);
    });

    res.json(withdrawals);
  } catch (error) {
    console.error("Error fetching withdrawal history:", error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history.' });
  }
});

/*******************
 * ADMIN ROUTES
 *******************/

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ error: 'Authorization header missing' });
  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = decoded;
    next();
  });
}

// Updated Admin Login Endpoint
// POST /api/admin/login
// Expects { email, password } in the request body.
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required.' });

  try {
    const adminsRef = db.ref('admins');
    // Query the "admins" node for a record matching the provided email
    const snapshot = await adminsRef.orderByChild('email').equalTo(email).once('value');

    if (!snapshot.exists()) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Assuming the email is unique, grab the first admin record.
    const admins = snapshot.val();
    const adminId = Object.keys(admins)[0];
    const adminData = admins[adminId];

    // Verify the password using bcrypt.
    const validPassword = await bcrypt.compare(password, adminData.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate a JWT token with an admin role.
    const token = jwt.sign({ uid: adminId, email: adminData.email, role: 'admin' }, JWT_SECRET, { expiresIn: '4h' });
    return res.json({ token });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get Admin Analytics
// GET /api/admin/analytics
// Returns total number of users and cumulative earnings.
app.get('/api/admin/analytics', authenticateAdmin, async (req, res) => {
  try {
    const snapshot = await db.ref('users').once('value');
    const usersData = snapshot.val() || {};
    const userCount = Object.keys(usersData).length;
    let totalEarnings = 0;
    Object.values(usersData).forEach(user => {
      totalEarnings += user.earnings || 0;
    });
    res.json({ userCount, totalEarnings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List All Users with Basic Info & Delete Option
// GET /api/admin/users
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const snapshot = await db.ref('users').once('value');
    const usersData = snapshot.val() || {};
    const users = Object.keys(usersData).map(uid => ({
      uid,
      name: usersData[uid].name,
      email: usersData[uid].email,
      earnings: usersData[uid].earnings,
      referralCode: usersData[uid].referralCode
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a User
// DELETE /api/admin/users/:uid
app.delete('/api/admin/users/:uid', authenticateAdmin, async (req, res) => {
  const uid = req.params.uid;
  try {
    await db.ref(`users/${uid}`).remove();
    res.json({ message: `User ${uid} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Pending Withdrawal Requests
// GET /api/admin/withdrawals/pending
app.get('/api/admin/withdrawals/pending', authenticateAdmin, async (req, res) => {
  try {
    const snapshot = await db.ref('users').once('value');
    const usersData = snapshot.val() || {};
    const pendingWithdrawals = [];
    Object.keys(usersData).forEach(uid => {
      const user = usersData[uid];
      if (user.withdrawalRequests) {
        Object.keys(user.withdrawalRequests).forEach(requestId => {
          const request = user.withdrawalRequests[requestId];
          if (request.status === 'pending') {
            pendingWithdrawals.push({
              uid,
              requestId,
              ...request
            });
          }
        });
      }
    });
    res.json(pendingWithdrawals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/********************************************************
// Approve / Update Withdrawal Request
// PUT /api/admin/withdrawals/:uid/:requestId
// Expects { status } in the request body (e.g., "approved" or "sent").
// *******************************************************/
app.put('/api/admin/withdrawals/:uid/:requestId', authenticateAdmin, async (req, res) => {
  const { uid, requestId } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'New status required.' });
  try {
    const withdrawalRef = db.ref(`users/${uid}/withdrawalRequests/${requestId}`);
    const snapshot = await withdrawalRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Withdrawal request not found.' });
    }
    await withdrawalRef.update({ status });
    res.json({ message: 'Withdrawal request updated.', requestId, newStatus: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// // This route creates an admin user in the Firebase Realtime Database.
// // IMPORTANT: Protect this endpoint in production (e.g., require a secret key).
// Simplified route to create an admin user (FOR DEVELOPMENT ONLY)
app.post('/api/admin/create', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const adminRef = db.ref('admins'); // Firebase reference
    const newAdminRef = adminRef.push();  // Push to create a unique key
    const adminId = newAdminRef.key;
    await newAdminRef.set({
      name,
      email,
      password: hashedPassword
    });

    res.json({ message: 'Admin user created successfully.', adminId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------------------------
   Helper Function: Generate a Unique Referral Code
--------------------------- */
async function generateUniqueReferralCode(db) {
  let code;
  let isCodeUnique = false;

  while (!isCodeUnique) {
    // Generate a random code and convert it to uppercase.
    code = Math.random().toString(36).substring(2, 15).toUpperCase();
    const snapshot = await db.ref('users').orderByChild('referralCode').equalTo(code).once('value');
    if (!snapshot.exists()) {
      isCodeUnique = true;
    }
  }

  return code;
}

/* ---------------------------
   Helper Function: Award Referral Bonus
--------------------------- */
async function awardReferralBonus(db, referrerUid, referredUid) {
  try {
    const userRef = db.ref(`users/${referrerUid}`);
    const userSnapshot = await userRef.once('value');
    const user = userSnapshot.val();

    if (!user) {
      console.error("Referral bonus not awarded: referrer not found");
      return;
    }

    // Avoid awarding duplicate referral bonus.
    if (user.referrals && user.referrals[referredUid]) {
      return;
    }

    // Count current referrals.
    let referralCount = user.referrals ? Object.keys(user.referrals).length : 0;
    referralCount++;
    const rewardAmount = 500;
    const newEarnings = (user.earnings || 0) + rewardAmount;

    const updatedReferral = { [referredUid]: true };

    await userRef.update({
      earnings: newEarnings,
      referralEarnings: (user.referralEarnings || 0) + rewardAmount,
      referrals: {
        ...user.referrals,
        ...updatedReferral
      },
      hasReferredMinUsers: referralCount >= 10
    });

    console.log(`Referral bonus awarded to user ${referrerUid} for referring ${referredUid}`);
  } catch (error) {
    console.error("Error awarding referral bonus:", error);
  }
}

/* ---------------------------
   Helper Function: Award Spins for Referral Task
--------------------------- */
async function awardSpinsForReferralTask(db, referrerUid) {
  try {
    const userRef = db.ref(`users/${referrerUid}`);
    const userSnapshot = await userRef.once('value');
    const user = userSnapshot.val();

    if (!user || !user.referrals) {
      console.log(`No referrals found for user ${referrerUid}`);
      return;
    }

    // If the user has exactly 3 referrals and hasn't yet been granted bonus spins.
    if (Object.keys(user.referrals).length === 3 && !user.referralSpinsGranted) {
      await userRef.update({
        freeSpins: (user.freeSpins || 0) + 5,
        referralSpinsGranted: true
      });
      console.log(`Awarded bonus spins to user ${referrerUid} for achieving 3 referrals`);
    } else {
      console.log(`User ${referrerUid} does not qualify for extra spins or has already been granted spins`);
    }
  } catch (error) {
    console.error("Error awarding spins for referral task:", error);
  }
}

/* ---------------------------
   Start the Server
--------------------------- */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
