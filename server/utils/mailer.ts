import { Resend } from 'resend'

/**
 * Small mail adapter so the provider can be swapped (Resend today).
 * To change provider: implement `Mailer` and return it from `getMailer()`.
 */
export interface MailMessage {
  to: string
  from: string
  replyTo?: string
  subject: string
  text: string
  html: string
}

export interface Mailer {
  name: string
  send: (msg: MailMessage) => Promise<void>
}

class ResendMailer implements Mailer {
  name = 'resend'
  private client: Resend
  constructor(apiKey: string) {
    this.client = new Resend(apiKey)
  }

  async send(msg: MailMessage) {
    const { error } = await this.client.emails.send({
      from: msg.from,
      to: msg.to,
      replyTo: msg.replyTo,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    })
    if (error) throw new Error(`Resend: ${error.message}`)
  }
}

/** Dev-only: logs the message instead of sending it. */
class ConsoleMailer implements Mailer {
  name = 'console'
  async send(msg: MailMessage) {
    console.info('[enquiry] (dev, not sent)\n', msg.subject, '\n', msg.text)
  }
}

export function getMailer(): Mailer | null {
  const config = useRuntimeConfig()
  if (config.resendApiKey) return new ResendMailer(config.resendApiKey)
  if (import.meta.dev) return new ConsoleMailer()
  return null
}
