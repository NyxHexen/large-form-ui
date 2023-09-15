function generateRandomFields(n) {
  const fields = [];
  const fieldTypes = ["date", "text"];
  const minNameIdLength = 16;
  const maxNameIdLength = 16;

  for (let i = 0; i < n; i++) {
    const randomType =
      fieldTypes[Math.floor(Math.random() * fieldTypes.length)];
    const nameLength =
      Math.floor(Math.random() * (maxNameIdLength - minNameIdLength + 1)) +
      minNameIdLength;
    const idLength = nameLength; // Use the same length for ID

    // Generate a random name and ID with letters and numbers
    const name = generateRandomString(nameLength);
    const id = "a" + generateRandomString(idLength);

    const field = {
      name,
      id,
      type: randomType,
    };
    fields.push(field);
  }

  return fields;
}

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

export default generateRandomFields;
