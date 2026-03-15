// src/components/ui/Spinner.tsx
export default function Spinner({ size = 'md', className }: { size?: 'sm'|'md'|'lg'; className?: string }) {
  const s = { sm:16, md:24, lg:40 }[size]
  const b = { sm:2, md:2, lg:3 }[size]
  return (
    <>
      <style>{`@keyframes _sp { to { transform:rotate(360deg) } }`}</style>
      <div className={className} style={{
        width:s, height:s, borderRadius:'50%',
        border:`${b}px solid #ede9fe`, borderTopColor:'#6d28d9',
        animation:'_sp 0.75s linear infinite', flexShrink:0,
      }} />
    </>
  )
}