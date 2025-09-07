// Test file for preview functionality
console.log("Hello World!");

const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

// Calculate first 10 Fibonacci numbers
for (let i = 0; i < 10; i++) {
  console.log(`Fibonacci(${i}) = ${fibonacci(i)}`);
}

const data = {
  name: "Test Preview",
  version: "1.0.0",
  features: [
    "Text file preview",
    "Code syntax highlighting", 
    "Image preview",
    "File editing with Monaco Editor",
    "Real-time saving"
  ]
};

console.log("Test data:", JSON.stringify(data, null, 2));