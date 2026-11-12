import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AppModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // Tipe data khusus untuk menampung komponen/elemen HTML anak
  submitLabel?: string;      // opsional
  cancelLabel?: string;     // Opsional
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;     // Opsional
  isLoading?: boolean;       // Opsional
  showFooter?: boolean;      // Opsional
}

export const AppModal = ({
  show,
  onClose,
  title,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onSubmit,
  isLoading = false,
  showFooter = true,
}: AppModalProps) => {
    return (
        <Dialog open={show} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form action="" onSubmit={onSubmit}>
                    <div className="py-2">{children}</div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading?"Loading...": submitLabel}
                        </Button>
                        <Button variant="outline" onClick={()=>onClose()}>
                            {cancelLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}