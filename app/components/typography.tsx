export const H1 = ({ children }: { children: string }) => {
  return <h1 className="text-4xl font-bold">{children}</h1>
}

export const H2 = ({ children }: { children: string }) => {
  return (
    <h2 className="text-lg font-semibold my-4 border-b pb-4 border-dashed border-brandOrange-400">
      {children}
    </h2>
  )
}
