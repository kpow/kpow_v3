import { cn } from "@/lib/utils"
import { VariantProps, cva } from "class-variance-authority"

const pageTitleVariants = cva(
  "font-slackey tracking-tight",
  {
    variants: {
      size: {
        default: "text-3xl",
        sm: "text-2xl",
        lg: "text-4xl",
      },
      alignment: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
      }
    },
    defaultVariants: {
      size: "default",
      alignment: "left"
    }
  }
)

interface PageTitleProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof pageTitleVariants> {
  subtitle?: string
}

export function PageTitle({ 
  className, 
  size, 
  alignment,
  subtitle,
  children,
  ...props 
}: PageTitleProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <h1 className={pageTitleVariants({ size, alignment })}>
        {children}
      </h1>
      {subtitle && (
        <p className={cn(
          "text-muted-foreground",
          {
            "text-center": alignment === "center",
            "text-right": alignment === "right"
          }
        )}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
