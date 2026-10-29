export const authRequestErrorMessage = (error, fallback) => {
  if (!error?.response) {
    return "Unable to connect. Please check your connection and try again.";
  }
  if (error.response.status >= 500) {
    return "This service is temporarily unavailable. Please try again shortly.";
  }
  return error.response.data?.message || fallback;
};
