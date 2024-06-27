import bcrypt from "bcrypt";
class Password_Encrypt_Decrypt_Technique {

    passwordEncrypt = async(password: string): Promise<string> =>{
        try{
            const setRounds: number = 10;
            const hashedPassword: string = await bcrypt.hash(password, setRounds);
            return hashedPassword;
        }
        catch(err){
            throw new Error("Server Error!");
        }
    }

    passwordDecrypt = async(password: string, hashedPassword: string): Promise<boolean> =>{
        return bcrypt.compare(password, hashedPassword);
    }
}


export default Password_Encrypt_Decrypt_Technique;