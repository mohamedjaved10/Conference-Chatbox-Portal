# Conference Chatbox

**Conference Chatbox** is a next-generation, real-time interactive classroom platform designed to bridge the communication gap between educators and students in large lecture halls and conferences. Traditional classroom settings often suffer from a lack of active participation, primarily due to students' fear of judgement or hesitation to speak up in front of their peers. This project solves that critical problem by providing a secure, dynamic, and completely anonymous digital environment where students can freely engage with their instructors without anxiety.

## Core Features

### Anonymous Q&A
At the core of the platform is the Anonymous Q&A feature. Once connected to a live session, students can submit questions, doubts, and feedback directly to the presenter’s screen in real-time. Because their identities are hidden from other students, it creates a psychologically safe space that drastically increases overall engagement, ensuring that no vital question goes unasked. 

### Live Polling and MCQs
Beyond standard messaging, the platform introduces a powerful Live Polling and Multiple Choice Question (MCQ) engine. Instructors can instantly push quizzes or surveys directly to all connected student devices. As students submit their answers, the system seamlessly aggregates the data in the background. With a single click, the instructor can trigger a real-time percentage reveal, broadcasting synchronized, animated progress bars across all screens to provide instant visual feedback on classroom comprehension.

### Secure Session Management
Security and session management are handled with utmost priority. The system operates on temporary, dynamically generated rooms. Instructors access a dedicated Admin Dashboard where they generate unique 4-digit Room IDs and custom passwords for each session. This prevents unauthorized access and ensures the integrity of the classroom. Furthermore, while student activity remains anonymous to peers, the admin retains full visibility for attendance tracking, complete with the ability to export one-click CSV reports.

## Technology Stack

Technologically, Conference Chatbox is built on a robust **Java Enterprise Edition (Java EE)** backend, leveraging **Java WebSockets** for high-performance, low-latency, bidirectional communication, all hosted on an **Apache Tomcat** server. 

The frontend boasts a modern, responsive Glassmorphism design built with pure **HTML, CSS, and Vanilla JavaScript**. By combining cutting-edge real-time web technologies with an intuitive user interface, Conference Chatbox transforms passive lectures into highly engaging, two-way educational experiences.
