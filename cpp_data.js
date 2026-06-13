/**
 * BCA STORE - C++ Programming & OOP Knowledge Base
 * Training dataset for the AI Assistant.
 */

const CPP_KNOWLEDGE = {
  // C++ Basics
  "what is c++": "C++ is a high-level, general-purpose programming language developed by Bjarne Stroustrup as an extension of the C language.",
  "is c++ object oriented": "Yes, C++ is a multi-paradigm language that supports procedural, object-oriented, and generic programming.",
  "cpp file extension": "The extension for a C++ source file is .cpp, and for a header file, it is .h or .hpp.",
  "namespace std": "The 'std' namespace is the standard C++ namespace where all library functions (like cout and cin) are defined.",
  "iostream": "A header file that defines the standard input/output stream objects.",

  // Input/Output
  "cout and cin": "cout (console output) is used to display data; cin (console input) is used to read data from the user.",
  "endl manipulator": "Used to insert a new line character and flush the output buffer.",
  "insertion vs extraction": "<< is the insertion operator (used with cout); >> is the extraction operator (used with cin).",

  // OOP Core Concepts
  "class and object": "A class is a blueprint or template for objects; an object is an instance of a class.",
  "encapsulation in cpp": "The process of wrapping data (variables) and functions into a single unit (class) to protect them from outside interference.",
  "abstraction": "The act of representing essential features without including background details or explanations.",
  "inheritance": "The mechanism by which one class acquires the properties and behaviors of another class.",
  "polymorphism": "The ability of a message or function to be displayed in more than one form (e.g., function overloading).",

  // Constructors & Destructors
  "constructor": "A special member function of a class that is automatically called when an object is created to initialize it.",
  "destructor": "A special member function called when an object goes out of scope or is deleted, used to release resources.",
  "copy constructor": "A constructor that initializes an object using another object of the same class.",

  // Inheritance Types
  "single inheritance": "One derived class inherits from one base class.",
  "multiple inheritance": "A derived class inherits from more than one base class.",
  "multilevel inheritance": "A class is derived from another derived class (forming a chain).",
  "hierarchical inheritance": "Multiple classes are derived from a single base class.",

  // Polymorphism Details
  "function overloading": "Defining multiple functions with the same name but different parameters within the same scope.",
  "function overriding": "Redefining a base class function in a derived class with the same signature.",
  "virtual function": "A function declared in a base class that is redefined in a derived class to achieve runtime polymorphism.",
  "pure virtual function": "A function with no implementation in the base class (declared as = 0), making the class abstract.",

  // Templates & STL
  "cpp template": "A powerful tool in C++ that allows you to write generic code that works with any data type.",
  "stl": "Standard Template Library; a collection of generic classes and functions for data structures and algorithms (Vectors, Lists, Maps).",
  "vector": "A dynamic array in STL that can grow or shrink in size automatically.",

  // File Handling
  "ofstream and ifstream": "ofstream is used to create and write to files; ifstream is used to read from files.",
  "fstream": "A stream class used for both reading and writing to files.",

  // Memory Management
  "new and delete": "Operators used for dynamic memory allocation and deallocation in C++.",
  "this pointer": "A constant pointer that holds the memory address of the current object.",

  // Exception Handling
  "try catch throw": "The keywords used for exception handling: 'try' checks for errors, 'throw' signals an error, and 'catch' handles it."
};

// Merge into the global knowledge base
if (typeof BCA_BOT_KNOWLEDGE !== 'undefined') {
  Object.assign(BCA_BOT_KNOWLEDGE, CPP_KNOWLEDGE);
}
