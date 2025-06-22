'use client'

import { Container, Typography, Paper, Box, useTheme, Button } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useTheme as useNextTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function TermsOfService() {
  const { theme: nextTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const theme = createTheme({
    palette: {
      mode: mounted && nextTheme === 'dark' ? 'dark' : 'light',
    },
  })

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/auth/register')}
          sx={{ 
            mb: 2,
            color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.700',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Вернуться к регистрации
        </Button>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper',
            color: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.900',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Условия пользования
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              1. Общие положения
            </Typography>
            <Typography paragraph>
              Настоящие Условия пользования регулируют отношения между пользователями и сервисом KTunes 
              при использовании музыкальной платформы. Используя наш сервис, вы соглашаетесь с данными условиями.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              2. Регистрация и учетная запись
            </Typography>
            <Typography paragraph>
              2.1. Для использования всех функций сервиса необходима регистрация.<br/>
              2.2. Вы обязуетесь предоставить достоверную информацию при регистрации.<br/>
              2.3. Вы несете ответственность за сохранность своих учетных данных.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              3. Использование сервиса
            </Typography>
            <Typography paragraph>
              3.1. Сервис предоставляет возможность прослушивания музыки и создания плейлистов.<br/>
              3.2. Запрещается использовать сервис для нарушения авторских прав.<br/>
              3.3. Запрещается распространение вредоносного контента.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              4. Авторские права
            </Typography>
            <Typography paragraph>
              4.1. Весь контент на платформе защищен авторским правом.<br/>
              4.2. Пользователи обязуются уважать права правообладателей.<br/>
              4.3. Запрещается несанкционированное копирование и распространение контента.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              5. Конфиденциальность
            </Typography>
            <Typography paragraph>
              5.1. Мы обязуемся защищать ваши персональные данные.<br/>
              5.2. Обработка данных осуществляется в соответствии с законодательством.<br/>
              5.3. Подробная информация содержится в Политике конфиденциальности.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              6. Ограничение ответственности
            </Typography>
            <Typography paragraph>
              6.1. Сервис предоставляется "как есть".<br/>
              6.2. Мы не несем ответственности за перерывы в работе сервиса.<br/>
              6.3. Пользователь принимает на себя все риски использования сервиса.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              7. Изменение условий
            </Typography>
            <Typography paragraph>
              7.1. Мы оставляем за собой право изменять данные условия.<br/>
              7.2. Пользователи будут уведомлены об изменениях.<br/>
              7.3. Продолжение использования сервиса означает согласие с новыми условиями.
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            Последнее обновление: {new Date().toLocaleDateString()}
          </Typography>
        </Paper>
      </Container>
    </ThemeProvider>
  )
} 