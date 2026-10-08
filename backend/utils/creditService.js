const User = require("../Models/User");
const CreditTransaction = require("../Models/CreditTransaction");

const normalizeAmount = (value) => Number(Number(value || 0).toFixed(2));
const toMinor = (value) => Math.round(Number(value || 0) * 100);

const resolveRequestedCredit = ({
  requestedCredits = 0,
  availableCredits = 0,
  orderTotal = 0,
}) => {
  const safeRequested = Math.max(normalizeAmount(requestedCredits), 0);
  const safeAvailable = Math.max(normalizeAmount(availableCredits), 0);
  const safeOrderTotal = Math.max(normalizeAmount(orderTotal), 0);

  return Math.min(safeRequested, safeAvailable, safeOrderTotal);
};

const deductCreditsFromUser = async (userId, amount, session = null, orderId = null, currencyInfo = null) => {
  const normalizedAmount = normalizeAmount(amount);

  if (normalizedAmount <= 0) {
    return null;
  }

  const user = await User.findById(userId).session(session);
  if (!user) {
    throw new Error("User not found");
  }

  if (normalizeAmount(user.credits) < normalizedAmount) {
    throw new Error("Insufficient wallet credits");
  }

  const balanceBefore = normalizeAmount(user.credits);
  user.credits = normalizeAmount(user.credits - normalizedAmount);
  const balanceAfter = normalizeAmount(user.credits);
  await user.save({ session });

  // Log transaction
  const description = orderId ? `Credits used for order #${orderId}` : `Credits used for order`;
  await CreditTransaction.create(
    [
      {
        user: userId,
        amount: normalizedAmount,
        currency: currencyInfo?.currency,
        amountInCurrency: normalizeAmount(currencyInfo?.amount),
        balanceBefore,
        balanceAfter,
        amountMinor: toMinor(normalizedAmount),
        amountInCurrencyMinor: toMinor(currencyInfo?.amount),
        type: "Deduction",
        order: orderId,
        description,
      },
    ],
    { session }
  );

  return user;
};

const restoreCreditsToUser = async (userId, amount, session = null, orderId = null, currencyInfo = null) => {
  const normalizedAmount = normalizeAmount(amount);

  if (normalizedAmount <= 0) {
    return null;
  }

  const user = await User.findById(userId).session(session);
  if (!user) {
    throw new Error("User not found");
  }

  const balanceBefore = normalizeAmount(user.credits);
  user.credits = normalizeAmount(user.credits + normalizedAmount);
  const balanceAfter = normalizeAmount(user.credits);
  await user.save({ session });

  // Log transaction
  const description = orderId ? `Credits restored from order #${orderId}` : `Credits restored from order`;
  await CreditTransaction.create(
    [
      {
        user: userId,
        amount: normalizedAmount,
        currency: currencyInfo?.currency,
        amountInCurrency: normalizeAmount(currencyInfo?.amount),
        balanceBefore,
        balanceAfter,
        amountMinor: toMinor(normalizedAmount),
        amountInCurrencyMinor: toMinor(currencyInfo?.amount),
        type: "Restore",
        order: orderId,
        description,
      },
    ],
    { session }
  );

  return user;
};

module.exports = {
  normalizeAmount,
  resolveRequestedCredit,
  deductCreditsFromUser,
  restoreCreditsToUser,
};
