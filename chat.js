export default async function handler(req, res) {
  const query = req.query.q;

  res.status(200).json({
    answer: "AI bol raha hai: " + query
  });
}