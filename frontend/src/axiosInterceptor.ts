import axios from "axios";
import Cookies from "js-cookie";

axios.defaults.headers.common["X-CSRFToken"] = Cookies.get("csrftoken");

axios.interceptors.request.use(
  (config) => {
    config.headers["X-CSRFToken"] = Cookies.get("csrftoken");
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axios;
