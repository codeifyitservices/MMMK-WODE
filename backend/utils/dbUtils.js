const mongoose = require("mongoose");

let isTransactionSupported = null;

/**
 * Checks if the current MongoDB connection supports transactions.
 * Cache the result to avoid repeated checks.
 */
const checkTransactionSupport = async () => {
  if (isTransactionSupported !== null) return isTransactionSupported;

  try {
    const session = await mongoose.startSession();
    // We don't actually need to start a transaction to check support, 
    // but startSession itself might be enough to check if it's a replica set/mongos.
    // However, to be sure, we can try to start and immediately abort a transaction.
    session.startTransaction();
    await session.abortTransaction();
    session.endSession();
    isTransactionSupported = true;
  } catch (error) {
    if (
      error.message.includes("Transaction numbers are only allowed on a replica set member or mongos") ||
      error.code === 20 // IllegalOperation
    ) {
      isTransactionSupported = false;
    } else {
      // If it's another error, we don't know yet, but let's assume no support for now 
      // or rethrow if it's a connection issue.
      isTransactionSupported = false;
    }
  }
  return isTransactionSupported;
};

/**
 * Safely starts a session and transaction if supported.
 * Returns the session if supported, otherwise returns null.
 */
const safeStartSession = async () => {
  const supported = await checkTransactionSupport();
  if (!supported) return null;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  } catch (error) {
    return null;
  }
};

/**
 * Safely commits a transaction if the session exists.
 */
const safeCommitTransaction = async (session) => {
  if (session && session.inTransaction()) {
    await session.commitTransaction();
  }
};

/**
 * Safely aborts a transaction if the session exists and is in a transaction.
 */
const safeAbortTransaction = async (session) => {
  if (session && session.inTransaction()) {
    await session.abortTransaction();
  }
};

/**
 * Safely ends a session if it exists.
 */
const safeEndSession = (session) => {
  if (session) {
    session.endSession();
  }
};

module.exports = {
  checkTransactionSupport,
  safeStartSession,
  safeCommitTransaction,
  safeAbortTransaction,
  safeEndSession,
};
