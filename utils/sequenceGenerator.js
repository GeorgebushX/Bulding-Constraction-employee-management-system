// utils/sequenceGenerator.js
import mongoose from 'mongoose';

const getNextSalaryId = async () => {
  try {
    const result = await mongoose.connection.db.collection('counters').findOneAndUpdate(
      { _id: 'supervisorSalaryId' },
      { $inc: { seq: 1 } },
      { 
        returnDocument: 'after',
        upsert: true 
      }
    );
    return result.seq;
  } catch (error) {
    console.error('Error generating salary ID:', error);
    throw error;
  }
};

export default getNextSalaryId;