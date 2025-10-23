export default function Button({ as:As='button', className='', children, ...props }){
return (
<As className={`btn btn-primary ${className}`} {...props}>{children}</As>
)
}