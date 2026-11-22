package com.loginanalysis.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyLoginStatDTO {

    private String date;

    private long successfulLogins;

    private long failedLogins;

    private long totalLogins;
}