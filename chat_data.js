/**
 * BCA STORE - Conversational & Chat Knowledge Base
 * This file contains human-like responses for greetings and casual interaction.
 */

const CHAT_KNOWLEDGE = {
  // ==========================================
  // 1. GREETINGS & CASUAL (Expanded)
  // ==========================================
  "hi": "Hello 👋 How can I help you today?",
  "hello": "Hi there 😊 What would you like to talk about?",
  "hey": "Hey 😄 Hope your day is going well.",
  "hii": "Hii! 👋 It's great to see you here.",
  "hiii": "Hiii! You seem energetic today! 🚀 How can I help?",
  "hlo": "Hlo! 😊 Kaise ho aap? Sab thik?",
  "hlw": "Hlw! 👋 I'm here to assist you with your BCA studies.",
  "hey there": "Hey there! Ready to learn something new today? 📚",
  "hola": "Hola! 👋 (That's 'hello' in Spanish!). How can I help?",
  "namaste": "Namaste! 🙏 Swagat hai BCA STORE mein. Main aapki kya madad kar sakta hoon?",
  "salam": "Walaikum Assalam! 👋 Hope you're having a productive day.",
  "yo": "Yo! 😎 What's the plan for today? Coding or Theory?",
  "gm": "GM! ☀️ Subah-subah padhai karne ka maza hi kuch aur hai. Chaliye shuru karte hain!",
  "gn": "GN! 🌙 Sleep well. 'Early to bed, early to rise' is great for students!",
  "good morning": "Good morning ☀️ Have a great day ahead and happy studying!",
  "good afternoon": "Good afternoon 🌤️ How's your day going? Need any help with subjects?",
  "good evening": "Good evening 🌆 How can I assist you tonight?",
  "good night": "Good night 🌙 So jao ab, kal phir se mehnat karni hai. Take care!",
  "kaise ho": "Main bilkul badhiya hoon! Aap kaise hain? 😊",
  "kya haal hai": "Sab ek dum mast! Aap bataiye, padhai kaisi chal rahi hai? 🚀",
  "what's up": "Just hanging out in the cloud, ready to help you build something awesome! 🚀",
  "whatsapp": "Chatting with you is my favorite thing to do right now! 😄",
  "bye": "Bye 👋 Have a wonderful day! Don't forget to revise.",
  "tata": "Tata! 👋 Phir milenge.",
  "see you": "See you soon! Keep learning. ✨",

  // ==========================================
  // 2. PROGRAMMING - C LANGUAGE (BCA-104)
  // ==========================================
  "what is c": "C is a powerful general-purpose programming language. It is fast, portable, and available on all platforms. It's often called the 'Mother of all languages'.",
  "who created c": "C was created by **Dennis Ritchie** at Bell Labs in 1972. 👴",
  "c syntax": "C syntax is a set of rules that defines how a C program is written and interpreted. It's very structured.",
  "variable in c": "A variable is a name given to a memory location. For example: `int a = 10;`",
  "data types in c": "Primary data types: `int`, `char`, `float`, `double`. Derived: `array`, `pointer`, `structure`.",
  "keywords in c": "There are 32 keywords in C, like `auto`, `break`, `case`, `char`, `const`, `continue`, etc.",
  "printf and scanf": "`printf()` is used for output, while `scanf()` is used for taking input from the user.",
  "if else in c": "Conditional statements used to perform different actions based on different conditions.",
  "switch case": "A multi-way branch statement that allows a value to be tested for equality against a list of values.",
  "loops in c": "C has 3 types of loops: `for`, `while`, and `do-while`. They are used for repeating a block of code.",
  "for loop syntax": "`for(initialization; condition; increment/decrement) { //code }`",
  "while vs do while": "`while` checks the condition first, `do-while` executes the code at least once before checking the condition.",
  "what is a function": "A function is a block of code that performs a specific task. It helps in code reusability.",
  "recursion": "A function that calls itself is known as recursion. It must have a base condition to stop.",
  "array in c": "An array is a collection of elements of the same data type stored in contiguous memory locations.",
  "pointer in c": "A pointer is a variable that stores the memory address of another variable. It uses the `*` operator.",
  "structure in c": "`struct` is a user-defined data type that allows grouping variables of different types.",
  "union in c": "Similar to structure, but all members share the same memory location. Only one member can store a value at a time.",
  "file handling in c": "C provides functions like `fopen()`, `fclose()`, `fprintf()`, `fscanf()` to work with files.",
  "dynamic memory allocation": "Allocating memory at runtime using functions like `malloc()`, `calloc()`, `realloc()`, and `free()`.",
  "header files": "Files containing function declarations and macro definitions (e.g., `#include <stdio.h>`).",
  "compiler vs interpreter": "A compiler translates the whole code at once; an interpreter translates it line-by-line.",
  "main function": "The entry point of any C program. Execution starts from `main()`.",
  "escape sequences": "Special characters like `\\n` (newline), `\\t` (tab), `\\b` (backspace).",
  "ternary operator": "A shorthand for `if-else`. Syntax: `condition ? expression1 : expression2;`",

  // ==========================================
  // 3. DATA STRUCTURES (BCA-203)
  // ==========================================
  "what is data structure": "A way of organizing and storing data so that it can be accessed and modified efficiently.",
  "linear vs non-linear": "Linear: Elements are in a sequence (Array, Stack). Non-linear: Hierarchical (Tree, Graph).",
  "stack": "A LIFO (Last In First Out) data structure. Operations: `push`, `pop`, `peek`.",
  "queue": "A FIFO (First In First Out) data structure. Operations: `enqueue`, `dequeue`.",
  "linked list": "A sequence of nodes where each node contains data and a pointer to the next node.",
  "doubly linked list": "Each node has two pointers: one to the next node and one to the previous node.",
  "circular linked list": "The last node points back to the first node instead of NULL.",
  "binary tree": "A tree structure where each node has at most two children (left and right).",
  "binary search tree": "A binary tree where the left child is smaller and the right child is larger than the parent node.",
  "searching algorithms": "Linear Search (O(n)) and Binary Search (O(log n)).",
  "sorting algorithms": "Bubble Sort, Selection Sort, Insertion Sort, Quick Sort, Merge Sort.",
  "bubble sort": "Repeatedly swaps adjacent elements if they are in the wrong order. O(n²).",
  "quick sort": "A divide-and-conquer algorithm that picks a 'pivot' and partitions the array around it.",
  "merge sort": "Divides the array into halves, sorts them, and then merges them back. O(n log n).",
  "hash table": "A data structure that stores data in an associative manner using a hash function.",
  "graph in ds": "A collection of nodes (vertices) and edges that connect them.",
  "bfs vs dfs": "BFS (Breadth-First Search) uses a queue; DFS (Depth-First Search) uses a stack.",
  "time complexity": "A measure of the amount of time an algorithm takes to run based on the size of the input (O-notation).",
  "space complexity": "The amount of memory an algorithm uses in relation to the input size.",
  "dynamic programming": "An optimization technique that solves complex problems by breaking them into simpler subproblems.",

  // ==========================================
  // 4. JAVA & OOPS (BCA-401)
  // ==========================================
  "what is java": "Java is a high-level, class-based, object-oriented programming language. It's known for 'Write Once, Run Anywhere' (WORA).",
  "oops concepts": "The 4 pillars of OOPs: **Encapsulation**, **Inheritance**, **Polymorphism**, and **Abstraction**.",
  "encapsulation": "Wrapping data and methods into a single unit (class) and hiding details using `private`.",
  "inheritance": "A mechanism where one class acquires the properties of another class using the `extends` keyword.",
  "polymorphism": "The ability of a single function or object to take multiple forms (Method Overloading & Overriding).",
  "abstraction": "Hiding implementation details and showing only essential features using `abstract` classes or interfaces.",
  "jvm vs jdk vs jre": "JDK (Kit) > JRE (Environment) > JVM (Machine). JVM runs the bytecode.",
  "bytecode": "The intermediate representation of Java code that the JVM executes.",
  "static keyword": "Used for memory management. Static members belong to the class, not to instances.",
  "this keyword": "Refers to the current object in a method or constructor.",
  "super keyword": "Refers to the immediate parent class object.",
  "final keyword": "Used to restrict the user (cannot change variable value, cannot override method, cannot inherit class).",
  "interface in java": "A blueprint of a class that only contains abstract methods and constants. Used for multiple inheritance.",
  "exception handling": "A mechanism to handle runtime errors using `try`, `catch`, `finally`, `throw`, and `throws`.",
  "multithreading": "The process of executing multiple threads simultaneously for maximum CPU utilization.",
  "garbage collection": "Automatic process of reclaiming unused memory by destroying unreachable objects.",
  "constructor": "A special method used to initialize objects. It has the same name as the class.",
  "abstract class": "A class that cannot be instantiated and may contain abstract methods.",
  "package in java": "A mechanism to encapsulate a group of classes, sub-packages, and interfaces.",
  "string in java": "An object that represents a sequence of characters. Strings are immutable in Java.",

  // ==========================================
  // 5. PYTHON & AI (BCA-502)
  // ==========================================
  "what is python": "A high-level, interpreted, general-purpose programming language. Known for its simple and readable syntax.",
  "python data types": "Numbers, Strings, Lists, Tuples, Dictionaries, Sets.",
  "list vs tuple": "Lists are mutable (can be changed); Tuples are immutable (cannot be changed).",
  "dictionary in python": "A collection of key-value pairs. Syntax: `{'name': 'Vishal', 'age': 21}`.",
  "python indentation": "Python uses indentation (whitespace) to define blocks of code, instead of curly braces.",
  "pip in python": "The package installer for Python. Used to install libraries like `numpy`, `pandas`, etc.",
  "what is ai": "Artificial Intelligence is the simulation of human intelligence by machines, especially computer systems.",
  "machine learning": "A subset of AI that focuses on building systems that learn from data.",
  "deep learning": "A subset of ML based on artificial neural networks with multiple layers.",
  "numpy": "A library for numerical computing in Python. Great for working with arrays.",
  "pandas": "A library for data manipulation and analysis. Uses DataFrames.",
  "matplotlib": "A plotting library for creating static, animated, and interactive visualizations in Python.",
  "tensorflow vs pytorch": "Popular frameworks for building and training deep learning models.",
  "nlp": "Natural Language Processing — helping computers understand and interpret human language.",

  // ==========================================
  // 6. OPERATING SYSTEMS (BCA-403)
  // ==========================================
  "what is os": "Software that acts as an interface between computer hardware and the user.",
  "types of os": "Batch, Time-sharing, Distributed, Network, Real-time OS.",
  "kernel": "The core part of an OS that manages hardware and software operations.",
  "process vs thread": "A process is a program in execution; a thread is a segment of a process (lightweight process).",
  "cpu scheduling": "The process of determining which process will own the CPU for execution while another process is on hold.",
  "scheduling algorithms": "FCFS, SJF, Priority Scheduling, Round Robin.",
  "deadlock": "A situation where two or more processes are waiting for each other to release resources, causing a freeze.",
  "deadlock prevention": "Techniques like Banker's Algorithm used to avoid deadlock situations.",
  "paging": "A memory management scheme that eliminates the need for contiguous allocation of physical memory.",
  "virtual memory": "A technique that allows the execution of processes that are not completely in memory.",
  "segmentation": "A memory management scheme that supports the user's view of memory (logical segments).",
  "file system": "The method and data structure an OS uses to keep track of files on a disk.",
  "semaphore": "A synchronization tool used to manage concurrent processes and avoid race conditions.",

  // ==========================================
  // 7. NETWORKING & SECURITY (BCA-504)
  // ==========================================
  "what is networking": "Connecting two or more computers to share resources and information.",
  "osi model": "A 7-layer framework for network communication: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
  "tcp/ip model": "A 4-layer model used for the modern internet: Link, Internet, Transport, Application.",
  "ip address": "A unique numerical label assigned to each device on a network. (IPv4 and IPv6).",
  "mac address": "A unique physical address assigned to a network interface card (NIC).",
  "hub vs switch": "Hub broadcasts data to all ports; Switch sends data only to the specific destination port.",
  "router": "A device that forwards data packets between computer networks.",
  "firewall": "A security system that monitors and controls incoming and outgoing network traffic.",
  "dns": "Domain Name System — translates domain names (like google.com) into IP addresses.",
  "http vs https": "HTTPS is the secure version of HTTP, using SSL/TLS encryption.",
  "cryptography": "The practice of securing communication from third parties (Encryption & Decryption).",
  "cyber law": "Laws that deal with legal issues related to the internet and computing (e.g., IT Act 2000).",
  "phishing": "A type of cyberattack where attackers pose as a legitimate entity to steal sensitive data.",
  "malware": "Malicious software like viruses, worms, and trojans designed to damage systems.",

  // ==========================================
  // 8. DBMS & SQL (BCA-302)
  // ==========================================
  "what is dbms": "Database Management System — software for creating and managing databases.",
  "rdbms": "Relational DBMS — stores data in tables with rows and columns (e.g., MySQL, Oracle).",
  "sql": "Structured Query Language — used for managing and manipulating relational databases.",
  "ddl vs dml vs dcl": "DDL (Create, Alter), DML (Insert, Update), DCL (Grant, Revoke).",
  "primary key": "A unique identifier for each record in a table. Cannot be NULL.",
  "foreign key": "A field that links two tables together. It refers to the primary key of another table.",
  "normalization": "The process of organizing data to reduce redundancy and improve data integrity (1NF, 2NF, 3NF, BCNF).",
  "acid properties": "Atomicity, Consistency, Isolation, Durability — ensures reliable transaction processing.",
  "join in sql": "Used to combine rows from two or more tables based on a related column.",
  "index in sql": "A performance optimization that allows faster retrieval of records.",
  "view in sql": "A virtual table based on the result-set of an SQL statement.",

  // ==========================================
  // 9. SOFTWARE ENGINEERING (BCA-404)
  // ==========================================
  "what is software engineering": "The systematic application of engineering principles to software development.",
  "sdlc": "Software Development Life Cycle — Phases: Planning, Analysis, Design, Implementation, Testing, Maintenance.",
  "waterfall model": "A linear sequential model where each phase must be completed before the next begins.",
  "agile model": "An iterative approach that focuses on continuous delivery and customer feedback.",
  "black box vs white box": "Black box tests functionality; White box tests internal logic and structure.",
  "software testing": "The process of verifying that a software product meets requirements and is bug-free.",

  // ==========================================
  // 10. BRABU & UNIVERSITY INFO
  // ==========================================
  "brabu": "Babasaheb Bhimrao Ambedkar Bihar University (BRABU) is a public university in Muzaffarpur, Bihar.",
  "bca marks distribution": "Total marks: 3200. Sem 1-5: 600 each. Sem 6: 200.",
  "passing marks": "You need to score at least 45% aggregate and pass in each paper separately.",
  "internal vs external": "Internal (College) is 20 marks; External (University) is 80 marks for theory papers.",
  "result kab aayega": "Check the official BRABU website or contact your college office for result updates.",
  "registration": "Registration is usually done in the first semester. Keep your documents ready!",

  // ==========================================
  // 11. CAREER & PROJECTS
  // ==========================================
  "bca scope": "Huge! You can go for MCA, MBA, or start a career as a Web Developer, Software Engineer, or Data Analyst.",
  "mca vs bca": "BCA is the bachelor's degree; MCA is the master's. MCA is highly recommended for better placement.",
  "project ideas": "1. Student Management System, 2. E-commerce Website, 3. Quiz Application, 4. Library Management.",
  "how to get internship": "Build 2-3 solid projects, update your LinkedIn, and apply on platforms like Internshala or LinkedIn.",
  "resume tips": "Keep it 1 page. Highlight projects, technical skills (C, Java, Python), and your CGPA.",
  "interview prep": "Focus on DSA, OOPs, and DBMS. Practice coding on platforms like LeetCode or HackerRank.",

  // ==========================================
  // 12. STUDENT LIFE & MOTIVATION
  // ==========================================
  "boring subject": "Try to find the real-world application of that subject. Or watch a video lecture on BCA STORE! 😉",
  "hard to focus": "Try the Pomodoro technique: 25 mins study + 5 mins break. Keep your phone away!",
  "late night study": "Dark mode on BCA STORE is perfect for that! Drink water and keep the room well-lit.",
  "exam fear": "Don't worry! Solve last 5 years' PYQs from our platform and you'll be confident.",
  "how to be a topper": "Consistency is key. Attend classes, make your own notes, and revise regularly.",
  "coding is hard": "It's like learning a new language. Practice every day and it will become your second nature.",
  "i failed": "Failure is just a lesson. Identify your weak areas and work on them. You can bounce back!",

  // ==========================================
  // 13. RECENT UPDATES & NEWS (Keywords for Intent)
  // ==========================================
  "what is new": "I'm constantly updated with the latest BRABU notifications and study materials. Ask 'What are the updates?'",
  "any news": "Check the 'Notifications' section on the Home page for the latest university news.",
  "new material": "Admin recently added new solved PYQs and video lectures. Explore your semester to see them!",

  // ==========================================
  // 14. FUN & CHATTY (Keywords)
  // ==========================================
  "joke": "Why did the programmer quit his job? Because he didn't get arrays! (a raise) 😂",
  "love": "Love is like a beautiful code — complex but rewarding when it works! ❤️",
  "food": "I've heard students love Maggi and Chai during exams. Is that true? 🍵",
  "hobby": "My hobby is indexing your syllabus and making sure you find your notes easily! 🤖",
  "smart": "I'm only as smart as my developer, Vishal, made me! But I'm learning from you too.",
  "stupid": "I'm sorry! I'm still a student myself. Tell me how I can be better? 😔",
  "thanks": "My pleasure! Now go and crush those exams! 🚀",
  "help": "Tell me what you need: Notes, PYQs, Syllabus, or just a pep talk?",
  "ok": "Alright! Let's get back to studying. 📖",
  "cool": "You're the cool one for using BCA STORE! 😎",
  "best website": "That's sweet! I'm glad you're finding BCA STORE helpful. Share it with your friends! 🙌",

  // ==========================================
  // 15. MISC STUDENT QUERIES (Token targets)
  // ==========================================
  "maths foundation": "BCA-101 (Math) covers: Calculus, Matrices, Trigo, and Set Theory. It's the base for algorithms.",
  "business comm": "BCA-103 covers: Formal letters, Reports, Group Discussions, and Information Systems.",
  "digital electronics": "BCA-202 covers: Logic Gates, Boolean Algebra, Flip-Flops, and Register design.",
  "system analysis": "BCA-204 (SAD) covers: SDLC, DFDs, E-R Diagrams, and System Testing.",
  "management accounting": "BCA-301 covers: Double entry, Balance sheets, and Financial management basics.",
  "numerical methods": "BCA-304 covers: Newton-Raphson, Simpson's Rules, and Interpolation. Use a calculator! 🧮",
  "computer graphics": "BCA-402 covers: DDA, Bresenham's, Clipping, and 2D/3D transformations.",
  "web tech": "BCA-503 covers: HTML5, CSS3, JavaScript basics, and Web architecture.",
  "oracle": "RDBMS (BCA-501) mostly uses Oracle/MySQL for SQL and PL/SQL practice.",
  "unix linux": "OS (BCA-403) includes Linux commands, Shell scripting, and File permissions.",
  "practical exams": "Practical exams are of 100 marks. External examiner will check your file and take a Viva. 🔬",
  "lab manual": "Check the 'Labs' section in your semester for ready-to-use programs and manual content.",
  "assignment": "If you need help with an assignment topic, just ask me specifically! ✍️",

  // ==========================================
  // 16. STUDENT FAQ (User Requested)
  // ==========================================
  "what is bca": "BCA is a computer application degree course.",
  "is bca available in lnd college": "Yes, BCA course is available.",
  "how many semesters are in bca": "There are 6 semesters.",
  "is coding difficult in bca": "No, practice makes it easy.",
  "which language is taught first": "Usually C language.",
  "is python taught in bca": "Yes, in some semesters.",
  "is java important for bca": "Yes, Java is very useful.",
  "does bca have practical classes": "Yes, regular practical labs happen.",
  "is laptop necessary for bca": "Yes, it is very helpful.",
  "can beginners do bca": "Yes, beginners can easily start.",
  "is math compulsory in bca": "Some semesters include math.",
  "does bca have projects": "Yes, project work is important.",
  "can i get job after bca": "Yes, many IT jobs are available.",
  "is bca better than ba": "For tech students, yes.",
  "can i do mca after bca": "Yes, MCA is common after BCA.",
  "is coding asked in exams": "Yes, coding questions come.",
  "is bca good for future": "Yes, IT field has good scope.",
  "does bca include web development": "Yes, web subjects are included.",
  "can i learn app development in bca": "Yes, you can.",
  "which subject is hardest in bca": "It depends on students.",
  "is english necessary in bca": "Basic English is important.",
  "can i learn coding from youtube": "Yes, definitely.",
  "does bca have internal exams": "Yes, internal exams happen.",
  "is bca theory difficult": "No, regular study helps.",
  "can i become software engineer after bca": "Yes, with good skills.",
  "is bca good for freelancing": "Yes, very useful.",
  "does lnd college have computer lab": "Yes, computer labs are available.",
  "can i use mobile in class": "Depends on teacher permission.",
  "is bca good for government jobs": "Yes, many exams are open.",
  "which coding language is easiest": "Python is easiest for beginners.",
  "is html taught in bca": "Yes, web basics are taught.",
  "full form of bca": "Bachelor of Computer Applications.",
  "is bca expensive": "Fees depend on college rules.",
  "can i do internship in bca": "Yes, internships are helpful.",
  "is bca better than b.tech": "Depends on career goals.",
  "can i make websites after bca": "Yes, easily.",
  "is linux taught in bca": "Basic Linux may be included.",
  "does bca have viva exams": "Yes, practical viva happens.",
  "is database important in bca": "Yes, DBMS is very important.",
  "can i learn ai after bca": "Yes, you can.",
  "is cybersecurity a good field": "Yes, it has great scope.",
  "can i crack placements after bca": "Yes, with preparation.",
  "does bca require coding daily": "Daily practice is recommended.",
  "is bca stressful": "Not if you manage time well.",
  "can i earn online during bca": "Yes, freelancing is possible.",
  "is practical knowledge important": "Yes, very important.",
  "can i study bca from home": "Online learning helps a lot.",
  "is teamwork important in bca": "Yes, especially in projects.",
  "can average students succeed in bca": "Yes, hard work matters most.",
  "does bca include networking": "Yes, networking basics are taught.",
  "is cloud computing taught in bca": "Sometimes included in syllabus.",
  "can i build apps after learning java": "Yes, Android apps can be built.",
  "is github useful for bca students": "Yes, very useful for projects.",
  "can i become web developer after bca": "Yes, absolutely.",
  "is c programming important": "Yes, it builds basics.",
  "can i prepare for upsc after bca": "Yes, definitely.",
  "is mca necessary after bca": "No, but it helps.",
  "can i get remote jobs after bca": "Yes, many remote jobs exist.",
  "is bca best for it field": "Yes, it is a strong option.",
  "which semester is toughest in bca": "Usually middle semesters feel harder.",
  "can i pass bca without coding": "Coding is important to learn.",
  "is aptitude needed for placements": "Yes, aptitude rounds are common.",
  "can i make games after bca": "Yes, game development is possible.",
  "is frontend development easy": "Yes, beginners enjoy it.",
  "is backend harder than frontend": "Backend needs more logic.",
  "can i join startup after bca": "Yes, startups hire BCA students.",
  "is communication skill important": "Yes, very important.",
  "can i build portfolio in bca": "Yes, through projects.",
  "is bca worth it in 2026": "Yes, IT demand is growing.",
  "does bca include software engineering": "Yes, software subjects are included.",
  "can i become data analyst after bca": "Yes, with proper skills.",
  "is internship compulsory in bca": "Depends on college rules.",
  "can i learn coding on mobile": "Yes, basic coding is possible.",
  "is chatgpt useful for bca students": "Yes, for learning and coding help.",
  "can i start freelancing in first year": "Yes, if skills are good.",
  "is java harder than python": "Java is slightly harder.",
  "can i get placement from lnd college": "Skills improve placement chances.",
  "is bca good for girls": "Yes, absolutely.",
  "lnd college": "LND College — A well-known educational institution in Bihar, recognized for quality higher education, experienced faculty, and a student-friendly campus environment 🎓✨",
  "lnd": "LND College — A well-known educational institution in Bihar, recognized for quality higher education, experienced faculty, and a student-friendly campus environment 🎓✨",
  "vishal": "Vishal Kumar is a talented developer from LND College who built this platform to help BCA students. 👨‍💻",

  // ==========================================
  // 17. LND COLLEGE FAQ (Hinglish)
  // ==========================================
  "lnd college kaha hai": "LND College Motihari, Bihar me located hai.",
  "lnd college me bca hai": "Haan, BCA course available hai.",
  "lnd college ka full form kya hai": "Lakshmi Narayan Dubey College.",
  "lnd college government hai ya private": "Ye ek recognized college hai.",
  "lnd college me admission kaise hota hai": "Official admission process se admission hota hai.",
  "lnd college ka environment kaisa hai": "Student-friendly aur educational environment hai.",
  "lnd college me computer lab hai": "Haan, computer lab available hai.",
  "lnd college me coding sikhate hai": "Haan, BCA me coding subjects hote hai.",
  "lnd college me semester system hai": "Haan, semester-wise exams hote hai.",
  "lnd college me practical hota hai": "Haan, practical classes regular hoti hai.",
  "lnd college me bca kitne saal ka hai": "BCA 3 years ka course hai.",
  "lnd college me placement milta hai": "Skills ke basis par opportunities mil sakti hai.",
  "lnd college me library hai": "Haan, library facility available hai.",
  "lnd college me uniform hai": "Department rules par depend karta hai.",
  "lnd college me canteen hai": "Haan, basic canteen facility hai.",
  "lnd college me girls safe hai": "Haan, safe environment provide kiya jata hai.",
  "lnd college me java padhaya jata hai": "Haan, Java BCA syllabus ka part ho sakta hai.",
  "lnd college me python hai": "Haan, programming subjects me include ho sakta hai.",
  "lnd college me projects bante hai": "Haan, students projects banate hai.",
  "lnd college me exams tough hote hai": "Preparation se exams manageable hote hai.",
  "lnd college me notes milte hai": "Haan, teachers notes provide karte hai.",
  "lnd college me fresher party hoti hai": "Kabhi-kabhi fresher events organize hote hai.",
  "lnd college me sports hai": "Haan, sports activities available hai.",
  "lnd college me ncc hai": "NCC activities available ho sakti hai.",
  "lnd college me scholarship milta hai": "Eligible students scholarship apply kar sakte hai.",
  "lnd college me wifi hai": "Kuch areas me internet facility ho sakti hai.",
  "lnd college me mobile allowed hai": "Teacher permission par depend karta hai.",
  "lnd college me teachers supportive hai": "Haan, teachers guidance dete hai.",
  "lnd college me bca achha hai": "Tech students ke liye achha option hai.",
  "lnd college me admission fee kitna hai": "Fee structure yearly update hota hai.",
  "lnd college me online class hota hai": "Situation ke according online classes ho sakti hai.",
  "lnd college me english important hai": "Basic English helpful hota hai.",
  "lnd college me coding difficult hai": "Practice se coding easy ho jati hai.",
  "lnd college me internship milta hai": "Students internships ke liye apply kar sakte hai.",
  "lnd college me ai padhaya jata hai": "Advanced topics me AI basics ho sakta hai.",
  "lnd college me web development hai": "Haan, web development topics hote hai.",
  "lnd college me app development sikh sakte hai": "Haan, coding knowledge se possible hai.",
  "lnd college me practical marks important hai": "Haan, practical marks important hote hai.",
  "lnd college me coding competition hota hai": "Technical events organize ho sakte hai.",
  "lnd college me best course kaunsa hai": "Student interest par depend karta hai.",
  "lnd college me bca ke baad mca kar sakte hai": "Haan, MCA popular option hai.",
  "lnd college me hostel hai": "Hostel availability administration par depend karti hai.",
  "lnd college me previous year paper milta hai": "Haan, students preparation ke liye use karte hai.",
  "lnd college me exam offline hota hai": "Mostly offline exams hote hai.",
  "lnd college me coding daily karna padta hai": "Regular practice helpful hoti hai.",
  "lnd college me bca beginners ke liye achha hai": "Haan, beginners start kar sakte hai.",
  "lnd college me farewell hota hai": "Haan, farewell events organize hote hai.",
  "lnd college me future scope kaisa hai": "Skills aur hard work par future depend karta hai."
};

// Merge into the global knowledge base
if (typeof BCA_BOT_KNOWLEDGE !== 'undefined') {
  Object.assign(BCA_BOT_KNOWLEDGE, CHAT_KNOWLEDGE);
}
