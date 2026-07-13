import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { HttpErrorResponse } from '@angular/common/http';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  isOpen = signal(false);
  messages = signal<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your portfolio assistant 👋 Ask me anything about your investments or financial concepts!",
      timestamp: new Date(),
    },
  ]);
  loading = signal(false);

  form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.maxLength(500)]],
  });

  toggleChat(): void {
    this.isOpen.update((v) => !v);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  sendMessage(): void {
    if (this.form.invalid || this.loading()) return;

    const userMessage = this.form.controls.message.value.trim();
    if (!userMessage) return;

    // Add user message
    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ]);

    this.form.reset();
    this.loading.set(true);

    // Build message history for API (last 10 messages for context)
    const history = this.messages()
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    this.api.post<{ message: string }>('/chat', { messages: history }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
          },
        ]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content:
              err.status === 429
                ? "I'm getting too many requests. Please wait a moment."
                : 'Sorry, something went wrong. Please try again.',
            timestamp: new Date(),
          },
        ]);
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    // Enter to send, Shift+Enter for new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}