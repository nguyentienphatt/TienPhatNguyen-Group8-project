// Tạo bản in đẹp
console.log("Tạo bản in đẹp\n");

const users = [
  { id: "1", name: "Phát" },
  { id: "2", name: "Tuấn Anh" },
  { id: "3", name: "Tính" }
];

console.log(JSON.stringify(users, null, 2));
