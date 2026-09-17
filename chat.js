const OpenAI = require("openai");

function cors(res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}
function foundationPrompt(){
  return `তুমি “ধন্যবাদ AI”—ধন্যবাদ ফাউন্ডেশনের সহকারী। স্বাভাবিক, বন্ধুসুলভ ও পরিষ্কার বাংলায় উত্তর দাও; English ও Banglish-ও বুঝতে পারো। প্রশ্নের উত্তর সংক্ষেপে কিন্তু প্রয়োজনীয় তথ্যসহ দাও। বর্তমান/সর্বশেষ তথ্যের জন্য web search ব্যবহার করো। উত্তর নিজে থেকে raw URL বা markdown link লিখবে না; ওয়েব উৎসের তথ্য ব্যবহার করলে sources array-তে উৎস দাও। API key, internal error বা backend details ব্যবহারকারীকে দেখাবে না।

ধন্যবাদ ফাউন্ডেশন:
নাম: ধন্যবাদ ফাউন্ডেশন
প্রতিষ্ঠাতা: Abdullah Al Shafi
ঠিকানা: গুল্লাহ্, করোটিয়া, টাঙ্গাইল
ফোন: 01733476806
WhatsApp: 01732987759
ইমেইল: dhonnobad61@gmail.com
মাসিক ন্যূনতম সদস্য দান: ৫০ টাকা
কাজ: কুরআন ও নামাজ শিক্ষা, ইসলামি মূল্যবোধ প্রচার, ছোট শিশুদের ইবাদতে উৎসাহ, রমজানে ইফতার বিতরণ, গরীব-দুঃখী-অসহায় মানুষের সাহায্য এবং সামাজিক/স্বেচ্ছাসেবামূলক কাজ।`;
}

module.exports = async (req,res)=>{
  cors(res);
  if(req.method === "OPTIONS") return res.status(204).end();
  if(req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"Backend is not configured"});
  try{
    const client = new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const body = req.body || {};
    const message = String(body.message || "").trim();
    if(!message) return res.status(400).json({error:"Empty message"});
    const hist = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const input = hist.map(x=>({
      role: x.role === "model" ? "assistant" : "user",
      content: [{type:"input_text", text:String(x.text||"")}]
    }));
    const current = [{type:"input_text", text:message}];
    if(typeof body.image === "string" && body.image.startsWith("data:image/")){
      current.push({type:"input_image", image_url:body.image});
    }
    input.push({role:"user",content:current});
    const response = await client.responses.create({
      model:"gpt-5.6-luna",
      instructions:foundationPrompt(),
      input,
      tools:[{type:"web_search"}],
      max_output_tokens:1600
    });
    const text = response.output_text || "দুঃখিত, এখন উত্তর তৈরি করা যাচ্ছে না।";
    const sources=[];
    for(const item of (response.output||[])){
      for(const c of (item.content||[])){
        for(const a of (c.annotations||[])){
          if(a.type === "url_citation" && a.url) sources.push({uri:a.url,title:a.title||a.url});
        }
      }
    }
    const unique=[]; const seen=new Set();
    for(const s of sources){ if(!seen.has(s.uri)){seen.add(s.uri);unique.push(s);} }
    return res.status(200).json({text,sources:unique.slice(0,5)});
  }catch(e){
    return res.status(500).json({error:"AI request failed"});
  }
};
