import supabase from "../../supabaseClient.js";

export const getRoles = async (req, res) => {
  const { data, error } = await supabase.from("roles").select("*");

  if (error) {
    res.status;
    res.send;
  }
  res.send({ data });
};
