/**
 * BCA STORE - Data Structures (DS) Knowledge Base
 * Training dataset for the AI Assistant.
 */

const DS_KNOWLEDGE = {
  // Basics of Data Structure
  "what is data structure": "A data structure is a specialized format for organizing, processing, retrieving, and storing data efficiently.",
  "types of data structures": "Categorized into Linear (Array, Linked List, Stack, Queue) and Non-Linear (Tree, Graph).",
  "primitive vs non-primitive": "Primitive are basic types (int, char, float). Non-primitive are complex structures (Arrays, Lists, Files).",
  "static vs dynamic ds": "Static has a fixed memory size (Array). Dynamic can grow or shrink during execution (Linked List).",
  "time and space complexity": "Time complexity measures the execution time; Space complexity measures the memory used by an algorithm.",
  "big o notation": "A mathematical notation used to describe the worst-case complexity or performance of an algorithm.",

  // Arrays
  "array in ds": "A linear data structure that stores elements of the same data type in contiguous memory locations.",
  "array traversal": "The process of visiting each element in an array exactly once for processing.",
  "sparse matrix": "A matrix where most of the elements are zero. It is often stored using special structures to save space.",

  // Linked Lists
  "linked list": "A linear data structure where elements (nodes) are stored in non-contiguous memory, connected by pointers.",
  "node structure": "A node typically contains two parts: Data and a Pointer (Link) to the next node.",
  "doubly linked list": "A list where each node contains pointers to both the next and the previous nodes.",
  "circular linked list": "A linked list where the last node points back to the first node, forming a circle.",

  // Stacks
  "stack": "A linear data structure that follows the LIFO (Last-In-First-Out) principle.",
  "push and pop": "Push adds an element to the top of the stack; Pop removes the top element.",
  "stack overflow": "A condition that occurs when you try to push an element into a stack that is already full.",
  "infix vs postfix": "Infix is A+B (operator in middle). Postfix is AB+ (operator at end). Stacks are often used for expression conversion.",

  // Queues
  "queue": "A linear data structure that follows the FIFO (First-In-First-Out) principle.",
  "enqueue and dequeue": "Enqueue adds an element to the rear; Dequeue removes an element from the front.",
  "priority queue": "A special type of queue where each element is associated with a priority, and elements are served based on that priority.",
  "deque": "A Double-Ended Queue where insertion and deletion can happen from both ends.",

  // Trees
  "binary tree": "A non-linear hierarchical structure where each node has at most two children (left and right).",
  "binary search tree": "A binary tree where the left child is smaller than the parent and the right child is larger.",
  "tree traversal types": "Preorder (Root-L-R), Inorder (L-Root-R), and Postorder (L-R-Root).",
  "leaf node": "A node in a tree that has no children.",
  "avl tree": "A self-balancing binary search tree where the height difference between left and right subtrees is at most 1.",

  // Graphs
  "graph in ds": "A non-linear data structure consisting of vertices (nodes) and edges (connections).",
  "directed vs undirected": "Directed edges have a specific orientation (arrows); undirected edges are bidirectional.",
  "adjacency matrix": "A 2D array used to represent a graph where the value indicates a connection between vertices.",
  "bfs vs dfs": "BFS (Breadth-First Search) uses a Queue. DFS (Depth-First Search) uses a Stack.",

  // Sorting & Searching
  "bubble sort": "A simple sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.",
  "binary search logic": "Finds an element in a sorted array by repeatedly dividing the search interval in half.",
  "quick sort": "A divide-and-conquer algorithm that picks a 'pivot' and partitions the array around it.",

  // Hashing
  "hashing purpose": "Used for extremely fast data retrieval (O(1) average time) by converting keys into array indices.",
  "hash collision": "When two different keys produce the same hash index. Handled via Chaining or Open Addressing.",

  // 400 Data Structure Terms
  "algorithm": "A step-by-step procedure or set of rules to be followed in calculations or other problem-solving operations.",
  "time complexity": "The amount of time taken by an algorithm to run as a function of the length of the input.",
  "space complexity": "The amount of memory space required by an algorithm to execute.",
  "worst case": "The maximum amount of time or space an algorithm will ever require for a given input size.",
  "static structure": "A data structure with a fixed memory size that cannot be changed during runtime.",
  "dynamic structure": "A data structure that can grow or shrink in size during execution.",
  "malloc()": "A function in C used to allocate a specific amount of memory dynamically during execution.",
  "calloc()": "Allocates multiple blocks of memory and initializes them to zero.",
  "realloc()": "Used to resize a previously allocated memory block.",
  "free()": "Releases the memory space previously allocated by malloc, calloc, or realloc.",
  "array index": "A number used to access a specific element within an array, starting from 0.",
  "traversal": "The process of visiting each node or element in a data structure exactly once.",
  "linear search": "A simple search algorithm that checks every element in a list until the target is found.",
  "bubble sort": "A sorting algorithm that adjacent elements and swaps them if they are in the wrong order.",
  "selection sort": "Finds the minimum element from the unsorted part and puts it at the beginning.",
  "insertion sort": "Builds the final sorted array one item at a time by inserting elements into their correct position.",
  "merge sort": "A recursive sorting algorithm that divides the array into halves, sorts them, and merges them back.",
  "stable sort": "A sorting algorithm that maintains the relative order of records with equal keys.",
  "linked list node": "The basic building block of a linked list, containing data and a reference to the next node.",
  "singly linked list": "A list where each node points only to the next node in the sequence.",
  "doubly linked list": "Each node contains pointers to both the next and the previous node.",
  "circular linked list": "A linked list where the last node is connected back to the first node.",
  "lifo": "Last-In-First-Out; the primary principle of a stack data structure.",
  "fifo": "First-In-First-Out; the primary principle of a queue data structure.",
  "push": "The operation of adding an element to the top of a stack.",
  "pop": "The operation of removing the top element from a stack.",
  "peek": "Viewing the top element of a stack without removing it.",
  "enqueue": "Adding an element to the end of a queue.",
  "dequeue": "Removing an element from the front of a queue.",
  "priority queue": "A queue where elements are removed based on their priority rather than just their arrival time.",
  "deque": "Double-Ended Queue; allows insertion and deletion from both the front and rear.",
  "binary tree": "A tree structure where each node has at most two children.",
  "leaf node": "A node in a tree that has no children.",
  "root node": "The top-most node in a tree structure.",
  "subtree": "A portion of a tree that is itself a complete tree structure.",
  "avl tree": "A self-balancing binary search tree where the height difference between subtrees is at most one.",
  "max heap": "A complete binary tree where the parent node's value is greater than or equal to its children.",
  "min heap": "A complete binary tree where the parent node's value is less than or equal to its children.",
  "inorder traversal": "A tree traversal method that visits nodes in the order: Left, Root, Right.",
  "preorder traversal": "A tree traversal method that visits nodes in the order: Root, Left, Right.",
  "postorder traversal": "A tree traversal method that visits nodes in the order: Left, Right, Root.",
  "graph vertex": "A node in a graph representing an entity.",
  "graph edge": "A connection between two vertices in a graph.",
  "directed graph": "A graph where edges have a specific direction (one-way).",
  "undirected graph": "A graph where edges have no direction (two-way).",
  "adjacency matrix": "A square matrix used to represent which vertices of a graph are adjacent to which other vertices.",
  "bfs": "Breadth-First Search; a graph traversal algorithm that explores all neighbors at the current depth.",
  "dfs": "Depth-First Search; a graph traversal algorithm that explores as far as possible along each branch before backtracking.",
  "dijkstra algorithm": "An algorithm for finding the shortest paths between nodes in a weighted graph.",
  "spanning tree": "A subset of a graph that covers all vertices with the minimum number of edges.",
  "hashing": "The process of converting a key into a fixed-size string or number using a hash function.",
  "hash table": "A data structure that stores key-value pairs for efficient retrieval.",
  "hash collision": "When two different keys map to the same index in a hash table.",
  "linear probing": "A collision resolution technique that searches for the next available slot sequentially.",
  "recursion": "The process in which a function calls itself directly or indirectly.",
  "base condition": "The condition in a recursive function that stops the recursion.",
  "backtracking": "An algorithmic technique for solving problems by trying out different options and stepping back if they fail.",
  "memoization": "An optimization technique that stores the results of expensive function calls and returns the cached result.",
  "greedy algorithm": "An algorithm that makes the locally optimal choice at each stage with the hope of finding a global optimum.",
  "abstract data type": "A mathematical model for data types where the data type is defined by its behavior (operations).",
  "segmentation fault": "A specific error caused by accessing memory that the CPU cannot physically address.",
  "memory leak": "Occurs when a program allocates memory but fails to release it back to the system after use.",
  "garbage collection": "The automatic process of reclaiming memory that is no longer being used by a program.",
  "stack memory": "The memory used for static memory allocation and function call management.",
  "heap memory": "The memory used for dynamic memory allocation during program execution."
};

// Merge into the global knowledge base
if (typeof BCA_BOT_KNOWLEDGE !== 'undefined') {
  Object.assign(BCA_BOT_KNOWLEDGE, DS_KNOWLEDGE);
}
