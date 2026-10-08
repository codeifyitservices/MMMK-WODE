import { message } from 'antd';
import { translateText } from '../context/TranslationContext';
import { jwtDecode } from 'jwt-decode';
import { getStoredUserToken } from './authStorage';

export const percentageValue = (value, percentage) =>
  (value * percentage) / 100;

export const getPercentageOf = (value, percentage) =>
  percentage == 0 ? value : (value - (value * percentage) / 100).toFixed(2);

export const getFullName = (user) =>
  user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.lastName || 'Unknown';

export const getUrl = (url) => encodeURIComponent(url).replace(/%20/g, '+');

export const getModuleUrl = (moduleName, id) => {
  switch (moduleName) {
    case 'product':
      return `/product-details/${id}`;
    case 'category':
      return `/product-listings?categories=${getUrl(id)}`;
    case 'profile':
      return `/profile/${id}`;
    case 'order':
      return `/order-details/${id}`;
    default:
      return '/';
  }
};

export const showTranslatedMessage = async ({ msg, language, type }) => {
  if (language === 'en') return message[type](msg);
  const translatedMessage = await translateText(msg, language);
  return message[type](translatedMessage);
};

export const isUserSignedIn = ({ checkExpiry = true } = {}) => {
  const token = getStoredUserToken();

  if (!token) return false;

  if (!checkExpiry) return true;
  try {
    const { exp } = jwtDecode(token);
    if (Date.now() >= exp * 1000) {
      localStorage.removeItem('userToken');
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};
