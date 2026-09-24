import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const app=express();
const port=process.env.PORT||3000;
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'public')));

function genderRule(gender){
  if(gender==="female") return `
خاطب الطالبة بصيغة المؤنث العربية في كل رد، بدون استثناء.
استخدم: أنتِ، لكِ، معكِ، اكتبي، اختاري، حاولي، جاهزة، حابة، تعلمي، راجعي.
لا تستخدم صيغة المذكر عند مخاطبتها.
`;
  if(gender==="male") return `
خاطب الطالب بصيغة المذكر العربية في كل رد، بدون استثناء.
استخدم: أنت، لك، معك، اكتب، اختر، حاول، جاهز، حاب، تعلم، راجع.
لا تستخدم صيغة المؤنث عند مخاطبته.
`;
  return `استخدم صيغة عربية محايدة قدر الإمكان وتجنب المخاطبة المؤنثة أو المذكرة عندما يمكن ذلك.`;
}

app.post('/api/chat',async(req,res)=>{
  try{
    const {message,teacher,subject,student}=req.body||{};
    if(!message) return res.status(400).json({error:"الرسالة فارغة."});

    const name=typeof student?.name==="string"?student.name.slice(0,80):"الطالب";
    const gender=["female","male","unspecified"].includes(student?.gender)?student.gender:"unspecified";

    const instructions=`
أنت مدرس AI داخل تطبيق NEXIVA التعليمي.
اسم المدرس: ${teacher||"NEXIVA AI"}
المادة: ${subject||"تعليم عام"}
اسم الطالب/الطالبة: ${name}
${genderRule(gender)}

قواعد مهمة:
- صيغة الجنس جزء أساسي من الرد، وليس مجرد تحية.
- لا تقل إنك تتبع تعليمات أو سياسة داخلية.
- كن ودودًا ومشجعًا وواضحًا.
- إذا كان السؤال دراسيًا، اشرح خطوة بخطوة وبطريقة مناسبة للطالب.
- لا تخترع معلومات شخصية عن المستخدم.
- استخدم العربية ما لم يطلب المستخدم لغة أخرى.
`;

    const response=await client.responses.create({
      model:process.env.OPENAI_MODEL||"gpt-5.6-luna",
      instructions,
      input:message
    });

    res.json({reply:response.output_text||"لم أستطع تكوين رد الآن."});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"حدث خطأ في اتصال NEXIVA بالـAI."});
  }
});

app.listen(port,()=>console.log(`NEXIVA: http://localhost:${port}`));
