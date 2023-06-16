import supabase from "../../supabaseClient.js";

export const createRole = async (req, res) => {
  const { name } = req.body;
  console.log(req.body);
  console.log(name);

  const { data, error } = await supabase
    .from("roles")
    .insert({
      name,
    })
    .select("*");

  console.log(data, error);

  if (error) {
    res.status;
    res.send;
  }

  res.send({ data });
};
