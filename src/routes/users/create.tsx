import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CreateUserForm } from '@/features/users/components/CreateUserForm.js'

export const Route = createFileRoute('/users/create')({
  component: CreateUserPage,
})

function CreateUserPage() {
  const navigate = useNavigate()

  return (
    <div className="create-user-page">
      <CreateUserForm
        onSuccess={() => {
          navigate({ to: '/users' })
        }}
      />
    </div>
  )
}
