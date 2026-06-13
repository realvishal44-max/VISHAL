/**
 * BCA STORE - Project & Developer Knowledge Base
 * This file contains information about the BCA Store platform itself.
 */

const PROJECT_KNOWLEDGE = {
  // Purpose and Vision
  "what is bca store": "BCA Store is a student-focused educational platform designed specifically for BCA learners to access study materials, coding resources, and academic guidance in one place.",
  "why was bca store created": "It was created to simplify the learning journey for BCA students by providing organized, high-quality resources and modern digital tools.",
  "purpose of bca store": "To bridge the gap between students and quality educational content, making computer science learning accessible and efficient.",
  "vision of bca store": "To become a complete digital learning ecosystem that empowers computer students worldwide.",
  "mission of bca store": "To provide a centralized platform for study notes, coding practice, career guidance, and community interaction.",
  "target audience": "BCA students, coding beginners, and any tech learners looking for structured computer science resources.",
  "problem solved by bca store": "It solves the problem of scattered study materials and the lack of specialized guidance for BCA curriculum.",

  // Developer Info
  "who developed bca store": "BCA Store was developed by **Vishal Kumar**, a passionate student developer focused on building innovative educational platforms.",
  "who is vishal kumar": "Vishal Kumar is the Founder and Lead Developer of BCA Store. He is a tech enthusiast dedicated to empowering students through technology.",
  "developer": "The mastermind behind BCA Store is **Vishal Kumar**. ✨\n\n[Discover the Mastermind](developer.html) 🚀",
  "developer motto": "Empowering students with technology, innovation, and smart learning solutions.",
  "why did vishal build this": "Vishal built BCA Store to solve the real-world challenges he and his peers faced in finding organized BCA study resources.",

  // Technical & Development
  "technologies used": "The platform is built using modern web technologies including HTML5, CSS3 (Vanilla & Glassmorphism), JavaScript (ES6+), and Firebase for backend/database services.",
  "frontend technologies": "HTML, CSS (with advanced animations), and JavaScript. It uses a responsive, mobile-first design philosophy.",
  "backend technologies": "Firebase is used for real-time database management, user authentication, and secure data storage.",
  "is it responsive": "Yes, BCA Store features a fully responsive design that works perfectly on mobile, tablets, and desktops.",
  "is there an admin panel": "Yes, there is a powerful Admin Dashboard for managing content, monitoring community activity, and updating resources.",
  "features of bca store": "Key features include an AI Assistant, Community Hub, Admin Dashboard, Study Batches, and organized Subject Notes.",
  "ai assistant": "The AI Assistant is a custom-trained bot that provides instant, local-first answers to Computer Fundamentals, Business Comm, and C Programming queries.",

  // Feature-Related & Technical
  "can students upload notes": "Currently, students can interact in the Community Hub. Note uploading is an admin-controlled feature to ensure quality, but students can share knowledge via doubts.",
  "is there a mobile app": "A dedicated mobile application for BCA Store is in the long-term roadmap to provide an even better mobile-first experience.",
  "what is coding playground": "The coding playground is a planned feature where students will be able to write and test C, Java, and Python code directly in the browser.",
  "how is user privacy maintained": "BCA Store uses Firebase Authentication and secure database rules to ensure that student data remains private and protected.",
  "is it commercial": "BCA Store is primarily an educational initiative, but it can be scaled for commercial use in the future with premium course integrations.",
  "why is clean code important": "Clean code ensures that the BCA Store platform remains maintainable, scalable, and easy to update with new features.",
  "can teachers manage content": "Yes, the platform is designed with a role-based structure where admins (and potentially teachers) can manage the study materials dynamically.",

  // Viva / Interview Specific
  "why choose this project": "I chose this project because it solves a real-world problem for thousands of BCA students who struggle to find organized, tech-driven study resources.",
  "biggest technical challenge": "The biggest challenge was architecting a local-first AI brain that can handle 1,000+ queries without slowing down the website.",
  "what did i learn": "Through this project, I mastered full-stack development, Firebase integration, responsive UI design, and the logic of building intelligent chatbots.",
  "project summary": "BCA Store is an all-in-one educational ecosystem that combines organized study resources, a community discussion hub, and a smart AI tutor for computer science students."
};

// Merge into the global knowledge base
if (typeof BCA_BOT_KNOWLEDGE !== 'undefined') {
  Object.assign(BCA_BOT_KNOWLEDGE, PROJECT_KNOWLEDGE);
}
