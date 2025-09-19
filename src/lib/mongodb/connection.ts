// MongoDB connection disabled due to missing mongoose dependency
// This is a stub file to prevent import errors

const connectToMongoDB = async (): Promise<void> => {
  console.log('MongoDB connection (stub) - mongoose dependency not available');
};

export default connectToMongoDB;