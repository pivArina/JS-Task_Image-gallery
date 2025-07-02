exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', 
    },
    body: JSON.stringify({
      ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY 
    }),
  };
};