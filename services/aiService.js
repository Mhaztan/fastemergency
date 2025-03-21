// services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generateBlogContent(topic, apiKey) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Write a blog post about ${topic}.
        Make the tone informative and engaging for a Nigerian audience who might be facing an emergency situation.
        Include practical advice and relevant resources.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error('Error generating blog content:', error);
        throw error;
    }
}

module.exports = {
    generateBlogContent
};