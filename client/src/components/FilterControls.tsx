import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterControlsProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  priorityFilter?: string;
  onPriorityChange?: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
}

export default function FilterControls({
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  priorityFilter,
  onPriorityChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: FilterControlsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="funded">Funded</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="education">Education</SelectItem>
          <SelectItem value="healthcare">Healthcare</SelectItem>
          <SelectItem value="environment">Environment</SelectItem>
          <SelectItem value="community">Community</SelectItem>
          <SelectItem value="technology">Technology</SelectItem>
          <SelectItem value="arts">Arts & Culture</SelectItem>
        </SelectContent>
      </Select>

      {onPriorityChange && (
        <Select value={priorityFilter || "all"} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="submittedAt">Date</SelectItem>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="requestedAmount">Amount</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Newest</SelectItem>
          <SelectItem value="asc">Oldest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
