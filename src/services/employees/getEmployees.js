import supabase from "../../supabaseClient.js";

export const getEmployees = async (req, res) => {
  const { data, error } = await supabase
    .from("employees")
    .select("*, roles(name)");

  if (error) {
    res.status(423).send({ error });
  }
  res.send({ data });
};
