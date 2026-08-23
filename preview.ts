const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 3000,
  routes: {
    "/*": { dir: "./pages" },
  },
});

console.log(`Previewing at ${server.url}`);
