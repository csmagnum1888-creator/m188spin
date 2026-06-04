import adminAction from "../../admin-action.js";

export default function handler(req, res) {
  req.body = { action: "generate_vouchers", payload: req.body || {} };
  return adminAction(req, res);
}
