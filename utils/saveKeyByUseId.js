export default function saveDataByUserId(data, objectData) {
  const userId = data.userId

  // Get the existing array of objects for the userId or initialize an empty array
  const existingData = objectData.get(userId) || []

  // Add the new data object to the array
  existingData.push(data)

  // Update the map with the array of objects for the userId
  objectData.set(userId, existingData)
}
