exports.getAllPatients = (req, res) => {
  res.json([
    { id: 1, name: "John Doe", age: 54 },
    { id: 2, name: "Jane Smith", age: 63 }
  ]);
};
