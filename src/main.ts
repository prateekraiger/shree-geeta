import { supabase } from './supabase'

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const container = document.getElementById('toast-container')
  if (!container) return

  const toast = document.createElement('div')
  toast.className = `toast toast--${type}`

  const icon = type === 'success' ? 'check_circle' : 'error'
  const title = type === 'success' ? 'Success' : 'Error'

  toast.innerHTML = `
    <span class="material-symbols-outlined toast-icon" style="font-variation-settings: 'FILL' 1;">${icon}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div>${message}</div>
    </div>
    <button class="toast-close" aria-label="Dismiss">&times;</button>
  `

  container.appendChild(toast)

  const dismiss = () => {
    toast.classList.add('toast-out')
    toast.addEventListener('animationend', () => toast.remove(), { once: true })
  }

  toast.querySelector('.toast-close')?.addEventListener('click', dismiss)

  setTimeout(dismiss, 5000)
}

const contactForm = document.getElementById('contactForm') as HTMLFormElement | null
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const submitBtn = contactForm.querySelector('button[type="submit"]') as HTMLButtonElement | null
    if (!submitBtn) return
    const originalBtnText = submitBtn.innerHTML
    
    // Disable button & show spinner/loading state
    submitBtn.disabled = true
    submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle; width: 1.25rem; height: 1.25rem;">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Sending Request...</span>
    `
    
    const formData = new FormData(contactForm)
    const payload = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      service: formData.get('service') as string,
      message: formData.get('message') as string
    }
    
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([payload])
        
      if (error) {
        showToast('Error submitting request: ' + error.message, 'error')
      } else {
        showToast('Thank you! Your consultation request has been submitted successfully. We will get back to you shortly.', 'success')
        contactForm.reset()
      }
    } catch (err: any) {
      console.error('Submission error:', err)
      showToast('Failed to send request. Please check your connection and try again.', 'error')
    } finally {
      submitBtn.disabled = false
      submitBtn.innerHTML = originalBtnText
    }
  })
}
