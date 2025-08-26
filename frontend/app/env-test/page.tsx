
export default function EnvTest(){
  const api = process.env.NEXT_PUBLIC_API_BASE_URL || '(not set)'
  return <div><h1 className="text-2xl font-bold mb-2">Env Test</h1><p>NEXT_PUBLIC_API_BASE_URL: {api}</p></div>
}
