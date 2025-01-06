module.exports = {
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "v2098j2#(K@v08vh293v8hp97GP(7G8p7gpqa9wubh2##LKJklasdn23n",
  API_PORT: process.env.API_PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  ALLOWED_ORIGINS: ["http://localhost:5173"],
};
