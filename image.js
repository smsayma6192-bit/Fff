const OpenAI = require("openai");
function cors(res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}
module.exports = async (req,res)=>{
  cors(res);
  if(req.method === "OPTIONS") return res.status(204).end();
  if(req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"Backend is not configured"});
  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const {prompt,size="1024x1024",referenceImage=null}=req.body||{};
    if(!prompt) return res.status(400).json({error:"Prompt required"});
    const safeSize=["1024x1024","1536x1024","1024x1536"].includes(size)?size:"1024x1024";
    let referenceNote="";
    if(typeof referenceImage === "string" && referenceImage.startsWith("data:image/")){
      const vision=await client.responses.create({
        model:"gpt-5.6-luna",
        input:[{role:"user",content:[
          {type:"input_text",text:"Describe only the visible visual characteristics needed to create a new image from this reference: composition, setting, lighting, clothing, colors, pose and objects. Do not identify or name any real person."},
          {type:"input_image",image_url:referenceImage}
        ]}]
      });
      referenceNote=vision.output_text||"";
    }
    const enhance=await client.responses.create({
      model:"gpt-5.6-luna",
      instructions:"Turn the user's Bengali/English image request into one concise professional image-generation prompt. Preserve the requested subject and scene. Do not identify real people. Avoid adding unwanted text unless the user asks for text.",
      input:`User request:\n${prompt}\n\nReference notes:\n${referenceNote}`
    });
    const finalPrompt=enhance.output_text||prompt;
    const image=await client.images.generate({
      model:"gpt-image-2",
      prompt:finalPrompt,
      size:safeSize,
      quality:"high",
      output_format:"png"
    });
    const b64=image.data?.[0]?.b64_json;
    if(!b64) return res.status(502).json({error:"No image returned"});
    return res.status(200).json({image:`data:image/png;base64,${b64}`,enhancedPrompt:finalPrompt});
  }catch(e){
    return res.status(500).json({error:"Image generation failed"});
  }
};
