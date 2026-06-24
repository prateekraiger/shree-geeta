import { supabase } from './supabase'

const loginSection = document.getElementById('login-section') as HTMLDivElement | null
const dashboardSection = document.getElementById('dashboard-section') as HTMLDivElement | null
const loginForm = document.getElementById('login-form') as HTMLFormElement | null
const loginError = document.getElementById('login-error') as HTMLDivElement | null
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement | null
const totalCountEl = document.getElementById('total-count') as HTMLSpanElement | null
const tableBody = document.getElementById('table-body') as HTMLTableSectionElement | null
const dbErrorAlert = document.getElementById('db-error-alert') as HTMLDivElement | null
const dbErrorDetails = document.getElementById('db-error-details') as HTMLPreElement | null

const isAdminAuthenticated = (): boolean => {
  return localStorage.getItem('admin_authenticated') === 'true'
}

const showLogin = () => {
  if (loginSection) loginSection.classList.remove('hidden')
  if (dashboardSection) dashboardSection.classList.add('hidden')
}

const showDashboard = () => {
  if (loginSection) loginSection.classList.add('hidden')
  if (dashboardSection) dashboardSection.classList.remove('hidden')
  loadSubmissions()
}

// Handle Login Form Submit
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(loginForm)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    const expectedUser = import.meta.env.VITE_ADMIN_USER || 'admin'
    const expectedPass = import.meta.env.VITE_ADMIN_PASS || 'admin123'

    if (username === expectedUser && password === expectedPass) {
      localStorage.setItem('admin_authenticated', 'true')
      if (loginError) loginError.classList.add('hidden')
      showDashboard()
    } else {
      if (loginError) loginError.classList.remove('hidden')
    }
  })
}

// Handle Logout Button
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('admin_authenticated')
    showLogin()
  })
}

// Handle Password Visibility Toggle
const togglePasswordBtn = document.getElementById('toggle-password') as HTMLButtonElement | null
const passwordInput = document.getElementById('password-input') as HTMLInputElement | null
const passwordEyeIcon = document.getElementById('password-eye-icon') as HTMLSpanElement | null

if (togglePasswordBtn && passwordInput && passwordEyeIcon) {
  togglePasswordBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'
      passwordEyeIcon.textContent = 'visibility_off'
    } else {
      passwordInput.type = 'password'
      passwordEyeIcon.textContent = 'visibility'
    }
  })
}

// Helper to escape HTML for XSS prevention
function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Fetch and Render Submissions
async function loadSubmissions() {
  if (!tableBody) return

  // Show loading skeleton
  tableBody.innerHTML = `
    <tr>
        <td colspan="6" class="px-6 py-20 text-center text-on-surface-variant/60">
            <span class="material-symbols-outlined text-5xl mb-3 text-gray-300 animate-spin block" style="width:100%">sync</span>
            <div class="font-semibold text-lg">Loading submissions...</div>
        </td>
    </tr>
  `

  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (dbErrorAlert) dbErrorAlert.classList.remove('hidden')
      if (dbErrorDetails) dbErrorDetails.textContent = error.message
      tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-10 text-center text-error font-semibold">
                Failed to load database submissions. See config error details above.
            </td>
        </tr>
      `
      return
    }

    if (dbErrorAlert) dbErrorAlert.classList.add('hidden')
    const submissions = data || []
    
    if (totalCountEl) {
      totalCountEl.textContent = submissions.length.toString()
    }

    if (submissions.length === 0) {
      tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-20 text-center text-on-surface-variant/60">
                <span class="material-symbols-outlined text-5xl mb-3 text-gray-300 block">mail_outline</span>
                <div class="font-semibold text-lg">No submissions yet</div>
                <div class="text-sm">Submissions from the contact form will show up here.</div>
            </td>
        </tr>
      `
      return
    }

    tableBody.innerHTML = ''
    submissions.forEach((item: any) => {
      const formattedDate = new Date(item.created_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      })

      const row = document.createElement('tr')
      row.className = 'border-b border-gray-100 hover:bg-gray-50/50 transition-colors'
      row.innerHTML = `
        <td class="px-6 py-4 font-bold text-on-surface whitespace-nowrap">${escapeHtml(item.name)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex flex-col gap-1">
                <a href="mailto:${escapeHtml(item.email)}" class="text-sm text-primary hover:underline flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">mail</span> ${escapeHtml(item.email)}
                </a>
                ${item.phone ? `
                <a href="tel:${escapeHtml(item.phone)}" class="text-xs text-on-surface-variant hover:underline flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">call</span> ${escapeHtml(item.phone)}
                </a>
                ` : '<span class="text-xs text-gray-400 italic">No phone</span>'}
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                ${escapeHtml(item.service || 'General Enquiry')}
            </span>
        </td>
        <td class="px-6 py-4 text-on-surface-variant max-w-md break-words">${escapeHtml(item.message || '')}</td>
        <td class="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">${formattedDate}</td>
        <td class="px-6 py-4 text-right whitespace-nowrap">
            <button class="delete-btn text-error hover:text-red-700 font-semibold inline-flex items-center gap-1 text-sm bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors" data-id="${item.id}">
                <span class="material-symbols-outlined text-sm">delete</span> Delete
            </button>
        </td>
      `
      
      const deleteBtn = row.querySelector('.delete-btn')
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          const id = deleteBtn.getAttribute('data-id')
          if (!id) return
          
          if (confirm('Are you sure you want to delete this submission?')) {
            const { error: delError } = await supabase
              .from('contact_submissions')
              .delete()
              .eq('id', id)
              
            if (delError) {
              alert('Error deleting submission: ' + delError.message)
            } else {
              loadSubmissions()
            }
          }
        })
      }

      tableBody.appendChild(row)
    })

  } catch (err: any) {
    if (dbErrorAlert) dbErrorAlert.classList.remove('hidden')
    if (dbErrorDetails) dbErrorDetails.textContent = err.message || 'Connection error'
  }
}

// Initial Boot Logic
if (isAdminAuthenticated()) {
  showDashboard()
} else {
  showLogin()
}
