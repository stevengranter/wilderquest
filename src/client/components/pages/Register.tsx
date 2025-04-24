import RegisterForm from '@/components/RegisterForm'
import {Card} from '@/components/ui/card'

export default function Register() {
    return (
        <div className='flex content-center justify-center p-10'>
            <Card className='flex p-5'>
                <RegisterForm/>
            </Card>
        </div>
    )
}
