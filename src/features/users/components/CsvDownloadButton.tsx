import { useDownloadUsersCsv } from '../hooks/use-download-users-csv.js'
import type { UserSearchParams } from '@/types/user.js'

interface CsvDownloadButtonProps {
  filters?: Pick<UserSearchParams, 'query' | 'role'>
}

export function CsvDownloadButton({ filters }: CsvDownloadButtonProps) {
  const { download, isDownloading, error } = useDownloadUsersCsv()

  return (
    <div className="csv-download">
      <button
        onClick={() => download(filters)}
        disabled={isDownloading}
        aria-label="CSVダウンロード"
      >
        {isDownloading ? 'ダウンロード中...' : 'CSVダウンロード'}
      </button>
      {error && (
        <p role="alert" className="download-error">
          ダウンロードに失敗しました
        </p>
      )}
    </div>
  )
}
