
'use client'
import { ReactNode } from 'react'
export default function QuestionCard({title,children}:{title:string,children:ReactNode}){
  return <div className="rounded-2xl shadow-sm border p-5 bg-white"><h3 className="text-lg font-semibold mb-3">{title}</h3><div className="space-y-3">{children}</div></div>
}
