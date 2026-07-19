import { createClient } from "@supabase/supabase-js";
const required=["NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SECRET_KEY","DEMO_CUSTOMER_EMAIL","DEMO_CUSTOMER_PASSWORD"];
const missing=required.filter((key)=>!process.env[key]);if(missing.length)throw new Error(`Missing environment values: ${missing.join(", ")}`);
const email=process.env.DEMO_CUSTOMER_EMAIL.trim().toLowerCase();const fullName=(process.env.DEMO_CUSTOMER_NAME||"Demo Customer").trim();const phone=(process.env.DEMO_CUSTOMER_PHONE||"").trim();
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
const{data:list,error:listError}=await admin.auth.admin.listUsers({page:1,perPage:1000});if(listError)throw listError;let user=list.users.find((item)=>item.email?.toLowerCase()===email);
if(!user){const{data,error}=await admin.auth.admin.createUser({email,password:process.env.DEMO_CUSTOMER_PASSWORD,email_confirm:true,app_metadata:{role:"CUSTOMER"},user_metadata:{full_name:fullName}});if(error)throw error;user=data.user;}else{const{data,error}=await admin.auth.admin.updateUserById(user.id,{password:process.env.DEMO_CUSTOMER_PASSWORD,email_confirm:true,app_metadata:{...user.app_metadata,role:"CUSTOMER"},user_metadata:{...user.user_metadata,full_name:fullName}});if(error)throw error;user=data.user;}
const{error:profileError}=await admin.from("profiles").update({full_name:fullName,phone,role:"CUSTOMER",is_active:true}).eq("id",user.id);if(profileError)throw profileError;
console.log(`Demo Customer ready: ${email}`);
