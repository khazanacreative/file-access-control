
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Document, User, getUserById } from '@/lib/data';
import { useDocuments } from '@/context/DocumentContext';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  FileSpreadsheet,
  File,
  Download,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Trash,
  Pencil
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DocumentCardProps {
  document: Document;
  className?: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  className,
}) => {
  const { canViewDocument, approveDocument, rejectDocument, deleteDocument } = useDocuments();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [documentName, setDocumentName] = useState(document.name);
  
  const uploader = getUserById(document.uploadedBy);
  const approver = document.approvedBy ? getUserById(document.approvedBy) : null;
  
  // Determine if the current user can edit this document
  const canEdit = user && (
    user.role === 'admin' || 
    (user.role === 'management' && user.department === document.department) ||
    document.uploadedBy === user.id
  );
  
  // Determine if the current user can approve this document
  const canApprove = user && (
    user.role === 'admin' || 
    (user.role === 'management' && user.department === document.department)
  ) && document.status === 'pending';
  
  const getFileIcon = (type: string) => {
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    } else if (type.includes('pdf') || type.includes('document') || type.includes('word')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    } else {
      return <File className="h-8 w-8 text-gray-600" />;
    }
  };
  
  const handleDownload = () => {
    const a = window.document.createElement('a');
    a.href = document.content;
    a.download = document.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };
  
  const handleEditSave = () => {
    // We would typically call an API to update the document name
    // For now, we'll just show a toast
    toast.success(`Document renamed to ${documentName}`);
    setIsEditModalOpen(false);
  };
  
  const getStatusBadge = () => {
    switch (document.status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };
  
  if (!user || !uploader) return null;
  
  // Check if the user can view this document
  if (!canViewDocument(document)) return null;

  return (
    <>
      <Card className={cn("doc-card overflow-hidden border shadow-sm hover:shadow-md transition-all", className)}>
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-2 rounded-md">
              {getFileIcon(document.type)}
            </div>
            <div>
              <h3 className="font-medium text-sm truncate max-w-[200px]">{document.name}</h3>
              <p className="text-xs text-muted-foreground">{formatFileSize(document.size)}</p>
            </div>
          </div>
          {getStatusBadge()}
        </CardHeader>
        <CardContent className="p-4 pt-2 pb-2">
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={uploader.avatar} />
              <AvatarFallback>{uploader.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Uploaded by <span className="font-medium text-foreground">{uploader.name}</span></p>
              <p className="text-[10px] text-muted-foreground">{formatDate(document.uploadDate)}</p>
            </div>
          </div>
          
          {document.status === 'approved' && approver && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={approver.avatar} />
                <AvatarFallback>{approver.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Approved by <span className="font-medium text-foreground">{approver.name}</span></p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-2 flex justify-between items-center">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {document.department}
          </Badge>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            
            {(canEdit || canApprove) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canApprove && (
                    <>
                      <DropdownMenuItem onClick={() => approveDocument(document.id)}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        <span>Approve</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => rejectDocument(document.id)}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        <span>Reject</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {canEdit && (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setDocumentName(document.name);
                        setIsEditModalOpen(true);
                      }}>
                        <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => deleteDocument(document.id)}>
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        <span className="text-red-600">Delete</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Document Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name</Label>
              <Input 
                id="documentName" 
                value={documentName} 
                onChange={(e) => setDocumentName(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentCard;
