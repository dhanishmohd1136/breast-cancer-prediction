export interface AuthorLink {
  label: string
  href: string
}

export const AUTHOR = {
  name: 'Muhammed Dhanish K',
  role: 'Built by',
  links: [
    { label: 'GitHub', href: 'https://github.com/dhanishmohd1136' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/muhammed-dhanish-k007/' },
  ] as AuthorLink[],
}
