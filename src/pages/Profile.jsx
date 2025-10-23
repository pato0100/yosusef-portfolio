import defaultData from '../data/defaultProfile.json'
import { loadProfile } from '../utils/storage'
import ProfileCard from '../components/ProfileCard'


export default function Profile(){
const profile = loadProfile(defaultData)
return (
<div className="space-y-8">
<ProfileCard profile={profile} />
</div>
)
}