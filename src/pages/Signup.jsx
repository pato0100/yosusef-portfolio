import { useSearchParams } from "react-router-dom"

const [params] = useSearchParams()

const inviteCode = params.get("invite")


const { data:invite } = await supabase
.from("invites")
.select("*")
.eq("code",inviteCode)
.single()

if(!invite){

setError("Invalid invite")

return

}


await supabase
.from("invites")
.update({
used_count:invite.used_count+1
})
.eq("id",invite.id)

invite.used_count < invite.max_uses
invite.expires_at > now()
